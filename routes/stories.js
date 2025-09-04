// routes/stories.js
import { Router } from "express";
import { Story } from "../models/Story.js";

const router = Router();

const ok = (res, data = {}) => res.json({ ok: true, ...data });
const err = (res, code = "BAD_REQUEST", http = 400, extra = {}) =>
  res.status(http).json({ error: code, ...extra });

/** GET /api/stories
 * List lightweight cards for browsing (limits payload).
 */
router.get("/", async (req, res) => {
  try {
    const docs = await Story.find(
      { isActive: true },
      {
        _id: 1,
        slug: 1,
        title: 1,
        authorName: 1,
        mainCategory: 1,
        subCategory: 1,
        genres: 1,
        headline: 1,
        "stats.avgRating": 1,
        "stats.totalPlayed": 1,
        "assets.images": { $slice: 1 },
      }
    )
      .sort({ "stats.totalPlayed": -1, title: 1 })
      .limit(50)
      .lean();

    return ok(res, { items: docs });
  } catch (err) {
    console.error("GET /api/stories error:", err);
    return err(res, "SERVER_ERROR", 500);
  }
});

/** GET /api/stories/:slug
 * Full detail for a single story page.
 */
router.get("/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase().trim();
    if (!slug) return err(res, "BAD_REQUEST", 400, { field: "slug" });

    const doc = await Story.findOne({ slug, isActive: true }).lean();
    if (!doc) return err(res, "NOT_FOUND", 404);

    return ok(res, doc);
  } catch (err) {
    console.error("GET /api/stories/:slug error:", err);
    return err(res, "SERVER_ERROR", 500);
  }
});

export default router; 