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
    // Apply category, subcategory, and search filters
    const { page, pageSize, sort, category, subcategory, mainCategory, subCategory, search } = req.query || {};
    const normalizedMain = (category || mainCategory || "").toString().trim();
    const normalizedSub = (subcategory || subCategory || "").toString().trim();
    const searchQuery = (search || "").toString().trim();
    const filter = { isActive: true };
    if (normalizedMain) filter.mainCategory = normalizedMain;
    if (normalizedSub) filter.subCategory = normalizedSub;
    if (searchQuery) {
      const regex = new RegExp(searchQuery, "i");
      filter.$or = [
        { title: regex },
        { authorName: regex },
        { tags: regex },
        { genres: regex },
      ];
    }
    console.log('[GET /api/stories] query', {
      raw: req.query,
      normalized: { mainCategory: normalizedMain, subCategory: normalizedSub, search: searchQuery },
      filter
    });

    // Build projection (no text score needed for regex search)
    const projection = {
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
      "assets.images": 1,
      "assets.videos": 1,
    };

    // Use consistent sorting for all queries
    const sortOptions = { "stats.totalPlayed": -1, title: 1 };

    const docs = await Story.find(filter, projection)
      .sort(sortOptions)
      .limit(50)
      .lean();

    // Debug: Log regex search functionality
    if (searchQuery) {
      console.log('[API -> stories] Regex search applied:', searchQuery, 'Result count:', docs.length);
    }

    // Debug: Log raw DB assets for each story
    docs.forEach(story => {
      console.log('[API -> DB Raw Assets]', story._id, {
        images: story.assets?.images,
        videos: story.assets?.videos,
        typeOfImages: typeof story.assets?.images,
        isArray: Array.isArray(story.assets?.images),
      });
    });

    // Safeguards: Ensure assets.images and assets.videos are always arrays
    docs.forEach(story => {
      if (story.assets) {
        story.assets.images = Array.isArray(story.assets.images)
          ? story.assets.images
          : story.assets.images
          ? [story.assets.images]
          : [];
        
        story.assets.videos = Array.isArray(story.assets.videos)
          ? story.assets.videos
          : story.assets.videos
          ? [story.assets.videos]
          : [];
      }
    });

    // Get total count for pagination (without limit)
    const totalCount = await Story.countDocuments(filter);

    // Debug: Log API response before sending
    console.log('[API Response -> story.assets]', docs.map(s => ({
      id: s._id,
      title: s.title,
      images: s.assets?.images,
      videos: s.assets?.videos,
    })));

    return ok(res, { items: docs, total: totalCount });
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

    // Enrich characters with their roles from the cast array
    if (doc.cast && doc.roles && doc.characters) {
      const enrichedCharacters = doc.characters.map(character => {
        const castEntry = doc.cast.find(c =>
          c.characterId === character._id?.toString() || c.characterId === character.id
        );
        const roleLabels = castEntry
          ? castEntry.roleIds
              .map(roleId => doc.roles.find(r => r.id === roleId || r._id?.toString() === roleId)?.label)
              .filter(Boolean)
          : [];

        return {
          ...character,
          roles: roleLabels.length ? roleLabels : undefined,
        };
      });

      doc.characters = enrichedCharacters;
    }

    return ok(res, doc);
  } catch (err) {
    console.error("GET /api/stories/:slug error:", err);
    return err(res, "SERVER_ERROR", 500);
  }
});

/** GET /api/stories/:slug/stats
 * Get story statistics (totalPlays, totalReviews, averageRating)
 */
router.get("/:slug/stats", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase().trim();
    if (!slug) return err(res, "BAD_REQUEST", 400, { field: "slug" });

    const story = await Story.findOne({ slug, isActive: true }).lean();
    if (!story) return err(res, "NOT_FOUND", 404);

    const stats = {
      totalPlays: story.stats?.totalPlayed || 0,
      totalReviews: story.stats?.totalReviews || 0,
      averageRating: story.stats?.avgRating || 0,
    };

    return ok(res, stats);
  } catch (err) {
    console.error("GET /api/stories/:slug/stats error:", err);
    return err(res, "SERVER_ERROR", 500);
  }
});

export default router; 