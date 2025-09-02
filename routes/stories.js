// routes/stories.js
import { Router } from "express";
import { Story } from "../models/Story.js";

const router = Router();

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

    res.json({ items: docs });
  } catch (err) {
    console.error("GET /api/stories error:", err);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

/** GET /api/stories/:slug
 * Full detail for a single story page.
 */
router.get("/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase().trim();
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const doc = await Story.findOne({ slug, isActive: true }).lean();
    if (!doc) return res.status(404).json({ error: "Story not found" });

    res.json(doc);
  } catch (err) {
    console.error("GET /api/stories/:slug error:", err);
    res.status(500).json({ error: "Failed to fetch story" });
  }
});

export default router; 