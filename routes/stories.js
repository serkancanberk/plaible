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
    // Apply category and subcategory filters
    const { page, pageSize, sort, category, subcategory, mainCategory, subCategory } = req.query || {};
    const normalizedMain = (category || mainCategory || "").toString().trim();
    const normalizedSub = (subcategory || subCategory || "").toString().trim();
    const filter = { isActive: true };
    if (normalizedMain) filter.mainCategory = normalizedMain;
    if (normalizedSub) filter.subCategory = normalizedSub;
    console.log('[GET /api/stories] query', {
      raw: req.query,
      normalized: { mainCategory: normalizedMain, subCategory: normalizedSub },
      filter
    });

    const docs = await Story.find(
      filter,
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

/** GET /api/stories/categories
 * Public aggregation of category and subcategory counts.
 */
router.get("/categories", async (req, res) => {
  try {
    console.log("[GET /api/stories/categories] hit", { at: new Date().toISOString() });
    // One-time distinct values log to verify current DB state
    const distinctMain = await Story.distinct('mainCategory');
    if (Array.isArray(distinctMain)) {
      console.log('[GET /api/stories/categories] distinct mainCategory:', distinctMain);
    }
    // Aggregate active stories by mainCategory and subCategory
    const pipeline = [
      { $match: { isActive: true } },
      {
        $group: {
          _id: { main: "$mainCategory", sub: "$subCategory" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.main",
          subCategories: {
            $push: { id: "$_id.sub", count: "$count" },
          },
          count: { $sum: "$count" },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          count: 1,
          subCategories: 1,
        },
      },
      { $sort: { id: 1 } },
    ];

    const results = await Story.aggregate(pipeline);
    console.log("[GET /api/stories/categories] results", { size: results?.length || 0 });
    return ok(res, { items: results || [] });
  } catch (e) {
    console.error("[GET /api/stories/categories] error:", e);
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