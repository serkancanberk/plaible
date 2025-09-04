// routes/feedbacks.js
import { Router } from "express";
import mongoose from "mongoose";
import { Story } from "../models/Story.js";
import { User } from "../models/User.js";

const router = Router();
import { Router as _Router } from "express";
export const publicFeedbacksRouter = _Router();

function isNonEmptyString(v) { return typeof v === "string" && v.trim().length > 0; }
function toSlug(v) { return String(v || "").trim().toLowerCase(); }
const ok = (res, data = {}) => res.json({ ok: true, ...data });
const err = (res, code = "BAD_REQUEST", http = 400, extra = {}) =>
  res.status(http).json({ error: code, ...extra });

// POST /api/feedbacks
// body: { storySlug: string, stars: 1..5, text?: string (<=250) }
router.post("/", async (req, res) => {
  try {
    if (!req.userId) return err(res, "UNAUTHENTICATED", 401);
    const { storySlug, stars, text } = req.body || {};
    const slug = toSlug(storySlug);
    if (!isNonEmptyString(slug)) return err(res, "BAD_REQUEST", 400, { field: "storySlug" });

    const n = Number(stars);
    if (!Number.isInteger(n) || n < 1 || n > 5) return err(res, "BAD_REQUEST", 400, { field: "stars" });

    if (text !== undefined) {
      if (typeof text !== "string") return err(res, "BAD_REQUEST", 400, { field: "text" });
      if (text.trim().length > 250) return err(res, "BAD_REQUEST", 400, { field: "text" });
    }

    const story = await Story.findOne({ slug, isActive: true });
    if (!story) return err(res, "NOT_FOUND", 404);

    // Load user for display info
    const user = await User.findById(req.userId, { "identity.displayName": 1, profilePictureUrl: 1 }).lean();
    if (!user) return err(res, "NOT_FOUND", 404);

    const displayName = user.identity?.displayName || "Plaible User";
    const profilePictureUrl = user.profilePictureUrl || "";

    const now = new Date();

    const fb = Array.isArray(story.feedbacks) ? story.feedbacks : [];
    const uidStr = String(req.userId);
    const idx = fb.findIndex(f => String(f.userId || "") === uidStr);

    const newEntry = {
      userId: new mongoose.Types.ObjectId(uidStr),
      profilePictureUrl,
      displayName,
      text: (text || "").trim(),
      stars: n,
      date: now
    };

    if (idx >= 0) {
      // Update existing review (idempotent)
      fb[idx] = newEntry;
    } else {
      fb.push(newEntry);
    }

    story.feedbacks = fb;

    // Recompute stats
    const rated = fb.filter(x => typeof x.stars === "number" && x.stars > 0);
    const totalReviews = rated.length;
    const avgRating = totalReviews
      ? Math.round((rated.reduce((a, b) => a + b.stars, 0) / totalReviews) * 10) / 10
      : 0;

    story.stats = {
      ...(story.stats || {}),
      totalReviews,
      avgRating
    };

    await story.save();

    return ok(res, {
      stats: story.stats,
      last: {
        displayName: newEntry.displayName,
        stars: newEntry.stars,
        text: newEntry.text,
        date: newEntry.date
      }
    });
  } catch (e) {
    console.error("[feedbacks:POST]", e);
    return err(res, "SERVER_ERROR", 500);
  }
});

// GET /api/stories/:slug/feedbacks?limit=20&cursor=<ISO date>
// newest first; cursor is "before" date for pagination
router.get("/story/:slug", async (req, res) => {
  try {
    const slug = toSlug(req.params.slug);
    if (!isNonEmptyString(slug)) return err(res, "BAD_REQUEST", 400, { field: "slug" });

    const story = await Story.findOne({ slug, isActive: true }, { feedbacks: 1 }).lean();
    if (!story) return err(res, "NOT_FOUND", 404);

    let limit = parseInt(String(req.query.limit ?? "20"), 10);
    if (Number.isNaN(limit) || limit <= 0) limit = 20;
    if (limit > 50) limit = 50;

    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";
    const all = Array.isArray(story.feedbacks) ? story.feedbacks.slice() : [];
    // sort by date desc
    all.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const filtered = cursor
      ? all.filter(x => new Date(x.date || 0) < new Date(cursor))
      : all;

    const page = filtered.slice(0, limit);
    const nextCursor = page.length === limit ? page[page.length - 1].date : undefined;

    return ok(res, { items: page.map(({ userId, _uid, ...rest }) => rest), nextCursor });
  } catch (e) {
    console.error("[feedbacks:GET]", e);
    return err(res, "SERVER_ERROR", 500);
  }
});

publicFeedbacksRouter.get("/story/:slug", async (req, res) => {
  try {
    const slug = toSlug(req.params.slug);
    if (!isNonEmptyString(slug)) return err(res, "BAD_REQUEST", 400, { field: "slug" });

    const story = await Story.findOne({ slug, isActive: true }, { feedbacks: 1 }).lean();
    if (!story) return err(res, "NOT_FOUND", 404);

    let limit = parseInt(String(req.query.limit ?? "20"), 10);
    if (Number.isNaN(limit) || limit <= 0) limit = 20;
    if (limit > 50) limit = 50;

    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";
    const all = Array.isArray(story.feedbacks) ? story.feedbacks.slice() : [];
    all.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const filtered = cursor
      ? all.filter(x => new Date(x.date || 0) < new Date(cursor))
      : all;

    const page = filtered.slice(0, limit);
    const nextCursor = page.length === limit ? page[page.length - 1].date : undefined;

    return ok(res, { items: page.map(({ userId, _uid, ...rest }) => rest), nextCursor });
  } catch (e) {
    console.error("[feedbacks:publicGET]", e);
    return err(res, "SERVER_ERROR", 500);
  }
});

export default router;
