import { Router } from "express";
import { Story } from "../models/Story.js";
import { Save } from "../models/Save.js";
import { Session } from "../models/Session.js";

const router = Router();

function isNonEmptyString(v) { return typeof v === "string" && v.trim().length > 0; }
function toSlug(v) { return String(v || "").trim().toLowerCase(); }
function ok(res, data) { return res.json(data); }
function err(res, code = 500, name = "SERVER_ERROR", field) {
  const body = field ? { error: name, field } : { error: name };
  return res.status(code).json(body);
}

// POST /api/saves
// POST /api/saves  body: { storySlug }
router.post("/", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const { storySlug } = req.body || {};
    if (!storySlug || typeof storySlug !== "string") {
      return res.status(400).json({ error: "BAD_REQUEST", field: "storySlug" });
    }

    // Load a lightweight projection from Story
    const story = await Story.findOne(
      { slug: storySlug },
      { _id: 1, slug: 1, title: 1, "assets.images": { $slice: 1 } }
    ).lean();

    if (!story) return res.status(404).json({ error: "NOT_FOUND", field: "storySlug" });

    const coverUrl = story.assets?.images?.[0] || null;

    // Atomic upsert; detect creation via lastErrorObject.upserted
    const result = await Save.findOneAndUpdate(
      { userId: req.userId, storyId: story._id },
      {
        $setOnInsert: {
          userId: req.userId,
          storyId: story._id,
          slug: story.slug,
          title: story.title,
          coverUrl,
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true, rawResult: true, projection: { _id: 1 } }
    );

    const created = !!result?.lastErrorObject?.upserted;

    // Only increment Story.stats.savedCount if this was newly created
    if (created) {
      await Story.updateOne(
        { _id: story._id },
        { $inc: { "stats.savedCount": 1 } }
      );
    }

    return res.json({ ok: true, created });
  } catch (e) {
    console.error("[saves:POST] error", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// DELETE /api/saves/:slug
// DELETE /api/saves/:slug
router.delete("/:slug", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const slug = String(req.params.slug || "").trim().toLowerCase();
    if (!slug) return res.status(400).json({ error: "BAD_REQUEST", field: "slug" });

    // Find the save to get storyId
    const saveDoc = await Save.findOne({ userId: req.userId, slug }, { storyId: 1 }).lean();
    if (!saveDoc) {
      // idempotent: deleting an already-missing save is still ok:true
      return res.json({ ok: true, deleted: false });
    }

    const del = await Save.deleteOne({ userId: req.userId, slug });
    const actuallyDeleted = del?.deletedCount > 0;

    if (actuallyDeleted && saveDoc.storyId) {
      await Story.updateOne(
        { _id: saveDoc.storyId },
        { $inc: { "stats.savedCount": -1 } }
      );
    }

    return res.json({ ok: true, deleted: !!actuallyDeleted });
  } catch (e) {
    console.error("[saves:DELETE] error", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// GET /api/saves
router.get("/", async (req, res) => {
  try {
    if (!req.userId) return err(res, 401, "UNAUTHENTICATED");
    let limit = parseInt(String(req.query.limit ?? "20"), 10);
    if (Number.isNaN(limit) || limit <= 0) limit = 20;
    if (limit > 50) limit = 50;

    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";
    const cursorDate = cursor ? new Date(cursor) : null;

    const query = { userId: req.userId };
    if (cursorDate && !isNaN(cursorDate.getTime())) {
      query.createdAt = { $lt: cursorDate };
    }

    const docs = await Save.find(query, { slug: 1, title: 1, coverUrl: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const items = (hasMore ? docs.slice(0, limit) : docs).map(d => ({
      slug: d.slug,
      title: d.title || "",
      coverUrl: d.coverUrl || "",
      createdAt: d.createdAt,
    }));
    const nextCursor = hasMore ? items[items.length - 1]?.createdAt : undefined;
    return ok(res, nextCursor ? { items, nextCursor } : { items });
  } catch (e) {
    return err(res, 500, "SERVER_ERROR");
  }
});

// OPTIONAL: GET /api/stories/:slug/is-saved
router.get("/story/:slug/is-saved", async (req, res) => {
  try {
    if (!req.userId) return err(res, 401, "UNAUTHENTICATED");
    const slug = toSlug(req.params.slug);
    if (!isNonEmptyString(slug)) return err(res, 400, "BAD_REQUEST", "slug");
    const story = await Story.findOne({ slug, isActive: true }, { _id: 1 });
    if (!story) return err(res, 404, "NOT_FOUND");
    const existing = await Save.findOne({ userId: req.userId, storyId: story._id }).lean();
    return ok(res, { saved: !!existing });
  } catch (e) {
    return err(res, 500, "SERVER_ERROR");
  }
});

// GET /api/saves/shelf?recentLimit=5&savedLimit=10
// Returns { recent: [...], saved: [...] }
router.get("/shelf", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const recentLimit = Math.max(1, Math.min(parseInt(req.query.recentLimit) || 5, 20));
    const savedLimit = Math.max(1, Math.min(parseInt(req.query.savedLimit) || 10, 50));

    // Recent = active sessions (not completed), most recent first
    const recents = await Session.find(
      { userId: req.userId, "progress.completed": false },
      { _id: 1, storyId: 1, "progress.chapter": 1, updatedAt: 1 }
    )
      .sort({ updatedAt: -1 })
      .limit(recentLimit)
      .lean();

    // Load story slugs/titles for recent
    const storyIds = recents.map(r => r.storyId).filter(Boolean);
    const storyMap = storyIds.length
      ? Object.fromEntries(
          (await Story.find(
            { _id: { $in: storyIds } },
            { _id: 1, slug: 1, title: 1, "assets.images": { $slice: 1 } }
          ).lean()).map(s => [String(s._id), s])
        )
      : {};

    const recent = recents.map(r => {
      const s = storyMap[String(r.storyId)];
      return {
        sessionId: String(r._id),
        slug: s?.slug || null,
        title: s?.title || null,
        coverUrl: s?.assets?.images?.[0] || null,
        chapter: r?.progress?.chapter || 1,
        updatedAt: r.updatedAt,
      };
    });

    // Saved = bookmarks
    const saves = await Save.find(
      { userId: req.userId },
      { _id: 0, slug: 1, title: 1, coverUrl: 1, createdAt: 1 }
    )
      .sort({ createdAt: -1 })
      .limit(savedLimit)
      .lean();

    return res.json({ recent, saved: saves });
  } catch (e) {
    console.error("[saves:shelf] error", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

export default router;


