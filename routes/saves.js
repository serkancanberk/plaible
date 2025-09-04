import { Router } from "express";
import { Story } from "../models/Story.js";
import { Save } from "../models/Save.js";
import { Session } from "../models/Session.js";

const router = Router();

function isNonEmptyString(v) { return typeof v === "string" && v.trim().length > 0; }
function toSlug(v) { return String(v || "").trim().toLowerCase(); }
const ok = (res, data = {}) => res.json({ ok: true, ...data });
const err = (res, code = "BAD_REQUEST", http = 400, extra = {}) =>
  res.status(http).json({ error: code, ...extra });

// POST /api/saves
// POST /api/saves  body: { storySlug }
router.post("/", async (req, res) => {
  try {
    if (!req.userId) return err(res, "UNAUTHENTICATED", 401);

    const { storySlug } = req.body || {};
    if (!storySlug || typeof storySlug !== "string") {
      return err(res, "BAD_REQUEST", 400, { field: "storySlug" });
    }

    // Load a lightweight projection from Story
    const story = await Story.findOne(
      { slug: storySlug },
      { _id: 1, slug: 1, title: 1, "assets.images": { $slice: 1 } }
    ).lean();

    if (!story) return err(res, "NOT_FOUND", 404, { field: "storySlug" });

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

    return ok(res, { created });
  } catch (e) {
    console.error("[saves:POST] error", e);
    return err(res, "SERVER_ERROR", 500);
  }
});

// DELETE /api/saves/:slug
// DELETE /api/saves/:slug
router.delete("/:slug", async (req, res) => {
  try {
    if (!req.userId) return err(res, "UNAUTHENTICATED", 401);

    const slug = String(req.params.slug || "").trim().toLowerCase();
    if (!slug) return err(res, "BAD_REQUEST", 400, { field: "slug" });

    // Find the save to get storyId
    const saveDoc = await Save.findOne({ userId: req.userId, slug }, { storyId: 1 }).lean();
    if (!saveDoc) {
      // idempotent: deleting an already-missing save is still ok:true
      return ok(res, { deleted: false });
    }

    const del = await Save.deleteOne({ userId: req.userId, slug });
    const actuallyDeleted = del?.deletedCount > 0;

    if (actuallyDeleted && saveDoc.storyId) {
      await Story.updateOne(
        { _id: saveDoc.storyId },
        { $inc: { "stats.savedCount": -1 } }
      );
    }

    return ok(res, { deleted: !!actuallyDeleted });
  } catch (e) {
    console.error("[saves:DELETE] error", e);
    return err(res, "SERVER_ERROR", 500);
  }
});

// GET /api/saves
router.get("/", async (req, res) => {
  try {
    if (!req.userId) return err(res, "UNAUTHENTICATED", 401);
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
    console.error("[saves:list]", e);
    return err(res, "SERVER_ERROR", 500);
  }
});

// OPTIONAL: GET /api/stories/:slug/is-saved
router.get("/story/:slug/is-saved", async (req, res) => {
  try {
    if (!req.userId) return err(res, "UNAUTHENTICATED", 401);
    const slug = toSlug(req.params.slug);
    if (!isNonEmptyString(slug)) return err(res, "BAD_REQUEST", 400, { field: "slug" });
    const story = await Story.findOne({ slug, isActive: true }, { _id: 1 });
    if (!story) return err(res, "NOT_FOUND", 404);
    const existing = await Save.findOne({ userId: req.userId, storyId: story._id }).lean();
    return ok(res, { saved: !!existing });
  } catch (e) {
    console.error("[saves:is-saved]", e);
    return err(res, "SERVER_ERROR", 500);
  }
});

// GET /api/saves/shelf?recentLimit=5&savedLimit=10
// Returns { recent: [...], saved: [...] }
router.get("/shelf", async (req, res) => {
  try {
    if (!req.userId) return err(res, "UNAUTHENTICATED", 401);

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

    return ok(res, { recent, saved: saves });
  } catch (e) {
    console.error("[saves:shelf] error", e);
    return err(res, "SERVER_ERROR", 500);
  }
});

export default router;


