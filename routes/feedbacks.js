// routes/feedbacks.js
import { Router } from "express";
import mongoose from "mongoose";
import { Story } from "../models/Story.js";
import { Feedback } from "../models/Feedback.js";
import { Event } from "../models/Event.js";

const router = Router();
import { Router as _Router } from "express";
export const publicFeedbacksRouter = _Router();

function isNonEmptyString(v) { return typeof v === "string" && v.trim().length > 0; }
function toSlug(v) { return String(v || "").trim().toLowerCase(); }
const ok = (res, data = {}) => res.json({ ok: true, ...data });
const err = (res, code = "BAD_REQUEST", http = 400, extra = {}) =>
  res.status(http).json({ error: code, ...extra });

/**
 * @swagger
 * /api/feedbacks:
 *   post:
 *     tags: [Stories]
 *     summary: Create feedback for a story
 *     description: Create or update feedback for a story (writes to feedbacks collection)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [storySlug, stars]
 *             properties:
 *               storySlug: { type: string, example: "the-picture-of-dorian-gray" }
 *               stars: { type: integer, minimum: 1, maximum: 5, example: 4 }
 *               text: { type: string, maxLength: 250, example: "Great story with interesting characters" }
 *     responses:
 *       200:
 *         description: Feedback created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 stats: { type: object, properties: { avgRating: { type: number }, totalReviews: { type: integer } } }
 *                 last: { type: object, properties: { _id: { type: string }, userId: { type: string }, storyId: { type: string }, stars: { type: integer }, text: { type: string }, createdAt: { type: string, format: date-time } } }
 *       401: { description: "Unauthenticated", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "UNAUTHENTICATED" } } } } } }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" }, field: { type: string } } } } } }
 *       404: { description: "Not Found", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "NOT_FOUND" } } } } } }
 */
// AUTH: Create feedback for a story (writes to feedbacks collection)
router.post("/", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const { storySlug, stars, text } = req.body || {};
    if (!storySlug) return res.status(400).json({ error: "BAD_REQUEST", field: "storySlug" });

    const s = Number(stars);
    if (!Number.isFinite(s) || s < 1 || s > 5) {
      return res.status(400).json({ error: "BAD_REQUEST", field: "stars" });
    }
    if (text && typeof text !== "string") {
      return res.status(400).json({ error: "BAD_REQUEST", field: "text" });
    }

    // 1) Story çöz
    const story = await Story.findOne({ slug: storySlug }, { _id: 1 }).lean();
    if (!story) return res.status(404).json({ error: "NOT_FOUND", field: "storySlug" });

    // 2) Insert (default status)
    const status = (process.env.FEEDBACK_DEFAULT_STATUS || "visible");
    const doc = await Feedback.create({
      userId: new mongoose.Types.ObjectId(userId),
      storyId: story._id,     // Story._id (string)
      stars: s,
      text: text || "",
      status,
      createdAt: new Date(),
    });

    // 3) Best-effort stats: visible yorumlarla hesapla
    let avgRating = null;
    let totalReviews = 0;
    try {
      const agg = await Feedback.aggregate([
        { $match: { storyId: story._id, status: "visible" } },
        { $group: { _id: null, avg: { $avg: "$stars" }, cnt: { $sum: 1 } } },
      ]);
      if (agg?.[0]) {
        avgRating = Math.round((agg[0].avg + Number.EPSILON) * 10) / 10; // 1 decimal
        totalReviews = agg[0].cnt;
      }
      // Story.stats güncelle (best-effort)
      await Story.updateOne(
        { _id: story._id },
        { $set: { "stats.avgRating": avgRating || 0, "stats.totalReviews": totalReviews } }
      ).catch(() => {});
    } catch (_) {
      // istatistik hesaplaması başarısız olsa da API dönsün
    }

    // 4) Event log (opsiyonel best-effort)
    try {
      await Event.create({
        type: "feedback.created",
        userId: new mongoose.Types.ObjectId(userId),
        meta: { storyId: story._id, stars: s },
        createdAt: new Date(),
      });
    } catch (_) {}

    // 5) Response → şema korunur
    const last = {
      _id: String(doc._id),
      userId: String(doc.userId),
      storyId: doc.storyId,
      stars: doc.stars,
      text: doc.text,
      createdAt: doc.createdAt,
    };

    return res.json({
      ok: true,
      stats: { avgRating: avgRating || 0, totalReviews },
      last,
    });
  } catch (err) {
    console.error("[feedbacks create] error:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * @swagger
 * /api/feedbacks/story/{slug}:
 *   get:
 *     tags: [Stories]
 *     summary: Get feedbacks for a story
 *     description: Retrieve paginated list of visible feedbacks for a story
 *     parameters:
 *       - in: path, name: slug, required: true, schema: { type: string }, description: Story slug
 *       - in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 }, description: Number of results per page
 *       - in: query, name: cursor, schema: { type: string, format: date-time }, description: Pagination cursor (ISO date)
 *     responses:
 *       200:
 *         description: Feedbacks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 items: { type: array, items: { type: object, properties: { _id: { type: string }, userId: { type: string }, storyId: { type: string }, stars: { type: integer }, text: { type: string }, createdAt: { type: string, format: date-time } } } }
 *                 nextCursor: { type: string, format: date-time, nullable: true }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 *       404: { description: "Not Found", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "NOT_FOUND" } } } } } }
 */
// PUBLIC: List feedbacks by story slug (visible only)
publicFeedbacksRouter.get("/story/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit, cursor } = req.query;

    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);

    // 1) StoryId (string) çöz
    const story = await Story.findOne({ slug }, { _id: 1 }).lean();
    if (!story) {
      return res.json({ ok: true, items: [], nextCursor: null });
    }

    // 2) Filtre kur
    const filter = { storyId: story._id, status: "visible" };
    if (cursor) {
      const c = new Date(cursor);
      if (!isNaN(c.getTime())) {
        filter.createdAt = { $lt: c };
      }
    }

    // 3) Sorgu (desc)
    const docs = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .limit(pageSize + 1)
      .lean();

    const hasMore = docs.length > pageSize;
    if (hasMore) docs.pop();

    // 4) Public DTO map (eski şemayı koruyacak şekilde basit alanlar)
    const items = docs.map(f => ({
      _id: String(f._id),
      userId: String(f.userId),
      storyId: f.storyId,          // Story._id (string)
      stars: f.stars,
      text: f.text,
      createdAt: f.createdAt,
    }));

    const nextCursor = hasMore ? items[items.length - 1]?.createdAt?.toISOString?.() || null : null;

    return res.json({ ok: true, items, nextCursor });
  } catch (err) {
    console.error("[public feedbacks list] error:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

export default router;
