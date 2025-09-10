import express from "express";
import { Story } from "../../models/Story.js";
import { logEvent } from "../../services/eventLog.js";
import { MAIN_CATEGORIES, LANGUAGES, CONTENT_RATINGS, LICENSES, STORY_STATUS, AGE_GROUPS } from "../../src/config/categoryEnums.js";
import { validateStoryEnums, validateArrayField, validateRequiredFields } from "../../src/utils/validation.js";

const router = express.Router();

// Helper functions
const ok = (res, data) => res.json({ ok: true, ...data });
const err = (res, code, field = null) => {
  const response = { error: code };
  if (field) response.field = field;
  return res.status(code === "BAD_REQUEST" ? 400 : code === "NOT_FOUND" ? 404 : 500).json(response);
};

/**
 * @swagger
 * /api/admin/stories:
 *   get:
 *     tags: [Admin]
 *     summary: List stories with filtering and pagination
 *     description: Retrieve paginated list of stories with optional filtering by query and isActive status
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query, name: query, schema: { type: string }, description: Search in title, slug, authorName
 *       - in: query, name: isActive, schema: { type: boolean }, description: Filter by active status
 *       - in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 }, description: Number of results per page
 *       - in: query, name: cursor, schema: { type: string, format: date-time }, description: Pagination cursor (ISO date by updatedAt)
 *     responses:
 *       200:
 *         description: Stories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 items: { type: array, items: { type: object } }
 *                 nextCursor: { type: string, format: date-time, nullable: true }
 *       403: { description: "Forbidden", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "FORBIDDEN" } } } } } }
 */
router.get("/", async (req, res) => {
  try {
    const { query: searchQuery, isActive, limit = 20, cursor } = req.query;
    const pageSize = Math.min(parseInt(limit) || 20, 100);

    // Build filter
    const filter = {};
    
    if (searchQuery) {
      const regex = new RegExp(searchQuery, 'i');
      filter.$or = [
        { title: regex },
        { slug: regex },
        { authorName: regex }
      ];
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (cursor) {
      filter.updatedAt = { $lt: new Date(cursor) };
    }

    // Query with limit + 1 to check for more results
    const stories = await Story.find(filter)
      .select('_id slug title isActive pricing stats updatedAt')
      .sort({ updatedAt: -1 })
      .limit(pageSize + 1)
      .lean();

    const hasMore = stories.length > pageSize;
    const items = hasMore ? stories.slice(0, pageSize) : stories;
    const nextCursor = hasMore ? items[items.length - 1].updatedAt.toISOString() : null;

    return ok(res, { items, nextCursor });
  } catch (error) {
    console.error("Admin stories list error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/stories/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get story details
 *     description: Retrieve full story document by string ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: id, required: true, schema: { type: string }, description: Story ID (string)
 *     responses:
 *       200:
 *         description: Story details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 story: { type: object }
 *       404: { description: "Not Found", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "NOT_FOUND" } } } } } }
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      return err(res, "BAD_REQUEST", "id");
    }

    const story = await Story.findById(id).lean();
    if (!story) {
      return err(res, "NOT_FOUND");
    }

    return ok(res, { story });
  } catch (error) {
    console.error("Admin story details error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/stories:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new story
 *     description: Create a new story with validation for slug uniqueness and cast consistency
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, summary, pricing, storyrunner]
 *             properties:
 *               title: { type: string, example: "The Picture of Dorian Gray" }
 *               slug: { type: string, example: "the-picture-of-dorian-gray" }
 *               authorName: { type: string, example: "Oscar Wilde" }
 *               summary: { type: object, properties: { original: { type: string }, modern: { type: string } } }
 *               pricing: { type: object, properties: { creditsPerChapter: { type: number }, estimatedChapterCount: { type: number } } }
 *               storyrunner: { type: object, properties: { systemPrompt: { type: string } } }
 *               characters: { type: array, items: { type: object } }
 *               roles: { type: array, items: { type: object } }
 *               cast: { type: array, items: { type: object } }
 *     responses:
 *       200:
 *         description: Story created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 storyId: { type: string, example: "story_dorian_gray" }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 */
router.post("/", async (req, res) => {
  try {
    const storyData = req.body;

    // Validate required fields
    const requiredValidation = validateRequiredFields(storyData, ['title', 'summary', 'pricing', 'storyrunner']);
    if (!requiredValidation.isValid) {
      return err(res, "BAD_REQUEST");
    }

    // Validate enum fields
    const enumValidation = validateStoryEnums(storyData);
    if (!enumValidation.isValid) {
      console.error('Story creation validation errors:', enumValidation.errors);
      return err(res, "BAD_REQUEST", enumValidation.errors[0]);
    }

    // Validate array fields
    const genresValidation = validateArrayField(storyData.genres, 'genres');
    if (!genresValidation.isValid) {
      return err(res, "BAD_REQUEST", "genres");
    }

    // Check slug uniqueness
    if (storyData.slug) {
      const existingStory = await Story.findOne({ slug: storyData.slug });
      if (existingStory) {
        return err(res, "BAD_REQUEST", "slug");
      }
    }

    // Validate cast consistency if provided
    if (storyData.characters && storyData.roles && storyData.cast) {
      const validation = Story.validateCastConsistency(storyData);
      if (!validation.ok) {
        return err(res, "BAD_REQUEST", validation.reason);
      }
    }

    const story = new Story(storyData);
    await story.save();

    // Log admin action
    await logEvent({
      type: "admin.stories.create",
      userId: req.userId,
      meta: { targetStoryId: story._id, title: story.title, slug: story.slug },
      level: "info"
    });

    return ok(res, { storyId: story._id });
  } catch (error) {
    console.error("Admin story create error:", error);
    if (error.code === 11000) {
      return err(res, "BAD_REQUEST", "slug");
    }
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/stories/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update story details
 *     description: Update story information with validation for cast consistency
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: id, required: true, schema: { type: string }, description: Story ID (string)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: "The Picture of Dorian Gray - Updated" }
 *               isActive: { type: boolean, example: true }
 *               pricing: { type: object, properties: { creditsPerChapter: { type: number } } }
 *               storyrunner: { type: object, properties: { systemPrompt: { type: string } } }
 *               characters: { type: array, items: { type: object } }
 *               roles: { type: array, items: { type: object } }
 *               cast: { type: array, items: { type: object } }
 *     responses:
 *       200:
 *         description: Story updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 *       404: { description: "Not Found", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "NOT_FOUND" } } } } } }
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || typeof id !== 'string') {
      return err(res, "BAD_REQUEST", "id");
    }

    const story = await Story.findById(id);
    if (!story) {
      return err(res, "NOT_FOUND");
    }

    const originalData = {
      title: story.title,
      isActive: story.isActive,
      pricing: story.pricing,
      storyrunner: story.storyrunner
    };

    // Process category fields if they come as objects
    if (typeof updateData.mainCategory === 'object' && updateData.mainCategory?.value) {
      updateData.mainCategory = updateData.mainCategory.value;
    }

    if (typeof updateData.subCategory === 'object' && updateData.subCategory?.value) {
      updateData.subCategory = updateData.subCategory.value;
    }

    if (Array.isArray(updateData.genres) && updateData.genres.length > 0 && typeof updateData.genres[0] === 'object') {
      updateData.genres = updateData.genres.map((g) => g.value || g);
    }

    // Validate enum fields
    const enumValidation = validateStoryEnums(updateData);
    if (!enumValidation.isValid) {
      console.error('Story update validation errors:', enumValidation.errors);
      return err(res, "BAD_REQUEST", enumValidation.errors[0]);
    }

    // Validate array fields
    const genresValidation = validateArrayField(updateData.genres, 'genres');
    if (!genresValidation.isValid) {
      return err(res, "BAD_REQUEST", "genres");
    }

    // Validate cast consistency if characters/roles/cast are being updated
    if (updateData.characters || updateData.roles || updateData.cast) {
      const mergedData = {
        ...story.toObject(),
        ...updateData
      };
      const validation = Story.validateCastConsistency(mergedData);
      if (!validation.ok) {
        return err(res, "BAD_REQUEST", validation.reason);
      }
    }

    // Apply updates
    Object.assign(story, updateData);
    story.updatedAt = new Date();
    await story.save();

    // Log admin action with diff
    const changes = {};
    Object.keys(updateData).forEach(key => {
      if (JSON.stringify(originalData[key]) !== JSON.stringify(updateData[key])) {
        changes[key] = updateData[key];
      }
    });

    await logEvent({
      type: "admin.stories.update",
      userId: req.userId,
      meta: { targetStoryId: id, changes, original: originalData },
      level: "info"
    });

    return ok(res);
  } catch (error) {
    console.error("Admin story update error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/stories/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update story status
 *     description: Change story active status
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: id, required: true, schema: { type: string }, description: Story ID (string)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean, example: false }
 *     responses:
 *       200:
 *         description: Story status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 *       404: { description: "Not Found", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "NOT_FOUND" } } } } } }
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!id || typeof id !== 'string') {
      return err(res, "BAD_REQUEST", "id");
    }

    if (typeof isActive !== 'boolean') {
      return err(res, "BAD_REQUEST", "isActive");
    }

    const story = await Story.findById(id);
    if (!story) {
      return err(res, "NOT_FOUND");
    }

    const oldStatus = story.isActive;
    story.isActive = isActive;
    story.updatedAt = new Date();
    await story.save();

    // Log admin action
    await logEvent({
      type: "admin.stories.status",
      userId: req.userId,
      meta: { targetStoryId: id, oldStatus, newStatus: isActive },
      level: "info"
    });

    return ok(res);
  } catch (error) {
    console.error("Admin story status update error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/stories/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Soft delete story
 *     description: Mark story as inactive (soft delete)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: id, required: true, schema: { type: string }, description: Story ID (string)
 *     responses:
 *       200:
 *         description: Story deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 *       404: { description: "Not Found", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "NOT_FOUND" } } } } } }
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return err(res, "BAD_REQUEST", "id");
    }

    const story = await Story.findById(id);
    if (!story) {
      return err(res, "NOT_FOUND");
    }

    story.isActive = false;
    story.deletedAt = new Date();
    story.updatedAt = new Date();
    await story.save();

    // Log admin action
    await logEvent({
      type: "admin.stories.delete",
      userId: req.userId,
      meta: { targetStoryId: id, title: story.title, slug: story.slug },
      level: "info"
    });

    return ok(res);
  } catch (error) {
    console.error("Admin story delete error:", error);
    return err(res, "SERVER_ERROR");
  }
});

export default router;
