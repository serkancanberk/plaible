import { Router } from "express";
import mongoose from "mongoose";
import { Story } from "../models/Story.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { WalletTransaction } from "../models/WalletTransaction.js";

const router = Router();

function bad(req, res, field) {
  return res.status(400).json({ error: "BAD_REQUEST", field });
}

function unauth(req, res) {
  return res.status(401).json({ error: "UNAUTHENTICATED" });
}

// POST /api/sessions/start
router.post("/start", async (req, res) => {
  try {
    if (!req.userId) return unauth(req, res);

    const body = req.body || {};
    const storySlug = typeof body.storySlug === "string" ? body.storySlug.trim().toLowerCase() : "";
    const characterId = typeof body.characterId === "string" ? body.characterId.trim() : "";
    const roleIdsRaw = body.roleIds;

    if (!storySlug) return bad(req, res, "storySlug");
    if (!characterId) return bad(req, res, "characterId");

    const story = await Story.findOne({ slug: storySlug, isActive: true }).lean();
    if (!story) return res.status(404).json({ error: "NOT_FOUND" });

    const characterExists = Array.isArray(story.characters) && story.characters.some(c => c.id === characterId);
    if (!characterExists) return bad(req, res, "characterId");

    let roleIds = [];
    if (Array.isArray(roleIdsRaw)) {
      roleIds = roleIdsRaw.filter(r => typeof r === "string");
      const validRoleIdSet = new Set((story.roles || []).map(r => r.id));
      const invalid = roleIds.find(r => !validRoleIdSet.has(r));
      if (invalid) return bad(req, res, "roleIds");
    }

    const cost = Number.isInteger(story?.pricing?.creditsPerChapter) && story.pricing.creditsPerChapter > 0
      ? story.pricing.creditsPerChapter
      : 10;

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });
    const balance = user?.wallet?.balance ?? 0;
    if (balance < cost) {
      return res.status(402).json({ error: "INSUFFICIENT_CREDITS", needed: cost, balance });
    }

    // Single active session guard: if there is an unfinished session for this user & story,
    // return it instead of creating a new one or charging again.
    const existing = await Session.findOne({
      userId: req.userId,
      storyId: story._id,
      "progress.completed": false
    }).lean();

    if (existing) {
      const latest = await User.findById(req.userId, "wallet.balance").lean();
      const latestBalance = latest?.wallet?.balance ?? 0;
      return res.json({
        sessionId: String(existing._id),
        story: { title: story.title, slug: story.slug },
        progress: existing.progress,
        wallet: { balance: latestBalance },
      });
    }

    // Idempotent chapter-1 charge: if a deduct for this user/story/chapter already exists,
    // do not charge again and continue starting the session.
    let alreadyCharged = false;

    const existingTx = await WalletTransaction.findOne({
      userId: req.userId,
      storyId: story._id,
      chapter: 1,
      type: "deduct",
    }).lean();

    if (!existingTx) {
      try {
        await WalletTransaction.createDeduct(
          req.userId,
          cost,
          story._id,
          1,
          "deduct:chapter"
        );
      } catch (e) {
        if (e && e.code === 11000) {
          // Unique index says we already have a deduct for chapter 1 — treat as already charged
          alreadyCharged = true;
        } else {
          throw e;
        }
      }
    } else {
      alreadyCharged = true;
    }

    // Decrement wallet only if we actually created a new deduct
    if (!alreadyCharged) {
      await User.findByIdAndUpdate(req.userId, { $inc: { "wallet.balance": -cost } });
    }

    const sess = await Session.create({
      userId: new mongoose.Types.ObjectId(String(req.userId)),
      storyId: story._id,
      characterId,
      roleIds: Array.isArray(roleIds) ? roleIds : [],
      progress: {
        chapter: 1,
        chapterCountApprox: Number.isInteger(story?.pricing?.estimatedChapterCount) && story.pricing.estimatedChapterCount > 0
          ? story.pricing.estimatedChapterCount
          : 10,
        completed: false,
      },
      log: [],
      mirror: { roleAlignment: null, relationships: [], criticalBeats: [], hint: null, progressNote: null },
      finale: { requested: false, requestedAt: null },
      rating: { stars: null, text: null },
    });

    const latest = await User.findById(req.userId, "wallet.balance").lean();
    const latestBalance = latest?.wallet?.balance ?? 0;

    return res.json({
      sessionId: String(sess._id),
      story: { title: story.title, slug: story.slug },
      progress: sess.progress,
      wallet: { balance: latestBalance },
    });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// (choice route moved below the list routes)

// GET /api/sessions/active
router.get("/active", async (req, res) => {
  try {
    if (!req.userId) return unauth(req, res);

    const storySlug = typeof req.query.storySlug === "string"
      ? req.query.storySlug.trim().toLowerCase()
      : "";

    let storyIdFilter = null;
    if (storySlug) {
      const story = await Story.findOne({ slug: storySlug, isActive: true }, { _id: 1, title: 1, slug: 1 }).lean();
      if (!story) return res.status(404).json({ error: "NOT_FOUND" });
      storyIdFilter = story._id;

      const sess = await Session.findOne({
        userId: req.userId,
        storyId: storyIdFilter,
        "progress.completed": false
      }).sort({ updatedAt: -1 }).lean();

      if (!sess) return res.status(404).json({ error: "NOT_FOUND" });

      const user = await User.findById(req.userId, "wallet.balance").lean();
      const balance = user?.wallet?.balance ?? 0;

      return res.json({
        sessionId: String(sess._id),
        story: { title: story.title, slug: story.slug },
        progress: sess.progress,
        wallet: { balance }
      });
    } else {
      const sess = await Session.findOne({
        userId: req.userId,
        "progress.completed": false
      }).sort({ updatedAt: -1 }).lean();

      if (!sess) return res.status(404).json({ error: "NOT_FOUND" });

      const story = await Story.findById(sess.storyId, { title: 1, slug: 1 }).lean();
      if (!story) return res.status(404).json({ error: "NOT_FOUND" });

      const user = await User.findById(req.userId, "wallet.balance").lean();
      const balance = user?.wallet?.balance ?? 0;

      return res.json({
        sessionId: String(sess._id),
        story: { title: story.title, slug: story.slug },
        progress: sess.progress,
        wallet: { balance }
      });
    }
  } catch (_err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// GET /api/sessions
router.get("/", async (req, res) => {
  try {
    if (!req.userId) return unauth(req, res);

    const valid = new Set(["active", "completed", "all"]);
    const status = valid.has(String(req.query.status)) ? String(req.query.status) : "active";

    let limit = parseInt(String(req.query.limit ?? "20"), 10);
    if (Number.isNaN(limit) || limit <= 0) limit = 20;
    if (limit > 50) limit = 50;

    const query = { userId: req.userId };
    if (status === "active") query["progress.completed"] = false;
    if (status === "completed") query["progress.completed"] = true;

    const cursor = typeof req.query.cursor === "string" ? req.query.cursor.trim() : "";
    if (cursor) {
      if (mongoose.Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
      }
    }

    const sessions = await Session
      .find(query, { storyId: 1, progress: 1, updatedAt: 1 })
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    if (!sessions.length) {
      return res.json({ items: [] });
    }

    // Map storyIds -> {title, slug}
    const storyIds = [...new Set(sessions.map(s => String(s.storyId)))];
    const stories = await Story.find(
      { _id: { $in: storyIds } },
      { title: 1, slug: 1 }
    ).lean();
    const storyMap = new Map(stories.map(st => [String(st._id), { title: st.title, slug: st.slug }]));

    const items = sessions.map(s => ({
      _id: String(s._id),
      story: storyMap.get(String(s.storyId)) || { title: "", slug: "" },
      progress: s.progress,
      updatedAt: s.updatedAt
    }));

    const nextCursor = sessions.length === limit ? String(sessions[sessions.length - 1]._id) : undefined;
    const resp = { items };
    if (nextCursor) resp.nextCursor = nextCursor;

    return res.json(resp);
  } catch (_err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// Re-add the choice route here (after / and /active, before /:id)
router.post("/:id/choice", async (req, res) => {
  try {
    if (!req.userId) return unauth(req, res);

    const sessionId = String(req.params.id || "").trim();
    if (!sessionId) return res.status(404).json({ error: "NOT_FOUND" });

    const body = req.body || {};
    const chosen = typeof body.chosen === "string" ? body.chosen : "";
    const freeText = typeof body.freeText === "string" ? body.freeText : "";
    const advanceChapter = Boolean(body.advanceChapter);

    const sess = await Session.findOne({ _id: sessionId, userId: req.userId });
    if (!sess) return res.status(404).json({ error: "NOT_FOUND" });

    // Append user log entry
    sess.log.push({
      role: "user",
      content: freeText,
      choices: [],
      chosen: chosen || null,
      ts: new Date()
    });

    let updatedWalletBalance;

    if (advanceChapter && !sess.progress.completed) {
      const nextChapter = (sess.progress?.chapter || 1) + 1;

      // Load story for pricing
      const story = await Story.findById(sess.storyId).lean();
      if (!story) return res.status(404).json({ error: "NOT_FOUND" });

      const cost = Number.isInteger(story?.pricing?.creditsPerChapter) && story.pricing.creditsPerChapter > 0
        ? story.pricing.creditsPerChapter
        : 10;

      // Read current wallet
      const userDoc = await User.findById(req.userId, "wallet.balance").lean();
      const balance = userDoc?.wallet?.balance ?? 0;
      if (balance < cost) {
        return res.status(402).json({ error: "INSUFFICIENT_CREDITS", needed: cost, balance });
      }

      // Deduct with unique-guarded tx for this chapter
      try {
        await WalletTransaction.createDeduct(req.userId, cost, sess.storyId, nextChapter, "deduct:chapter");
      } catch (e) {
        if (e && e.code === 11000) {
          // Already deducted for this chapter — idempotent advance
        } else {
          throw e;
        }
      }

      // Decrement wallet
      const updatedUser = await User.findByIdAndUpdate(
        req.userId,
        { $inc: { "wallet.balance": -cost } },
        { new: true, projection: { "wallet.balance": 1 } }
      ).lean();
      updatedWalletBalance = updatedUser?.wallet?.balance ?? balance - cost;

      // Advance progress
      sess.progress.chapter = nextChapter;

      const approx = Number.isInteger(story?.pricing?.estimatedChapterCount) && story.pricing.estimatedChapterCount > 0
        ? story.pricing.estimatedChapterCount
        : 10;

      if (nextChapter >= approx) {
        sess.progress.completed = true;
      }
    }

    await sess.save();

    const response = {
      sessionId: String(sess._id),
      progress: sess.progress,
      log: sess.log.slice(-5) // return last few entries to keep payload light
    };
    if (updatedWalletBalance !== undefined) {
      response.wallet = { balance: updatedWalletBalance };
    }
    return res.json(response);
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// POST /api/sessions/:id/complete
router.post("/:id/complete", async (req, res) => {
  try {
    if (!req.userId) return unauth(req, res);

    const sessionId = String(req.params.id || "").trim();
    if (!sessionId) return res.status(404).json({ error: "NOT_FOUND" });

    // Light input validation
    const body = req.body || {};
    let stars = body.stars;
    let text = body.text;

    if (stars !== undefined) {
      const n = Number(stars);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return res.status(400).json({ error: "BAD_REQUEST", field: "stars" });
      }
      stars = n;
    }

    if (text !== undefined) {
      if (typeof text !== "string") {
        return res.status(400).json({ error: "BAD_REQUEST", field: "text" });
      }
      text = text.trim();
      if (text.length > 250) {
        return res.status(400).json({ error: "BAD_REQUEST", field: "text" });
      }
    }

    const sess = await Session.findOne({ _id: sessionId, userId: req.userId });
    if (!sess) return res.status(404).json({ error: "NOT_FOUND" });

    // If already completed, just return current state (idempotent)
    if (sess.progress?.completed === true) {
      return res.json({
        sessionId: String(sess._id),
        progress: sess.progress,
        finale: sess.finale,
        rating: sess.rating ?? null
      });
    }

    // Mark as completed and set finale flags
    sess.progress = {
      ...(sess.progress || {}),
      completed: true
    };

    sess.finale = {
      ...(sess.finale || {}),
      requested: true,
      requestedAt: new Date()
    };

    if (stars !== undefined || text !== undefined) {
      sess.rating = {
        ...(sess.rating || { stars: null, text: null }),
        stars: stars ?? sess.rating?.stars ?? null,
        text: text ?? sess.rating?.text ?? null
      };
    }

    await sess.save();

    return res.json({
      sessionId: String(sess._id),
      progress: sess.progress,
      finale: sess.finale,
      rating: sess.rating ?? null
    });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

export default router;
// GET /api/sessions/:id (must be last)
router.get("/:id", async (req, res) => {
  try {
    if (!req.userId) return unauth(req, res);
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(404).json({ error: "NOT_FOUND" });

    const sess = await Session.findById(id).lean();
    if (!sess) return res.status(404).json({ error: "NOT_FOUND" });
    if (String(sess.userId) !== String(req.userId)) return res.status(404).json({ error: "NOT_FOUND" });

    return res.json(sess);
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});
