import express from "express";
import mongoose from "mongoose";
import { Feedback } from "../../models/Feedback.js";
import { logEvent } from "../../services/eventLog.js";

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
 * /api/admin/feedbacks:
 *   get:
 *     tags: [Admin]
 *     summary: List feedbacks with filtering and pagination
 *     description: Retrieve paginated list of feedbacks with optional filtering by storyId, userId, status, and stars
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query, name: storyId, schema: { type: string }, description: Filter by story ID
 *       - in: query, name: userId, schema: { type: string }, description: Filter by user ID (ObjectId)
 *       - in: query, name: status, schema: { type: string, enum: [visible, hidden, flagged, deleted] }, description: Filter by status
 *       - in: query, name: starsGte, schema: { type: integer, minimum: 1, maximum: 5 }, description: Filter by minimum stars rating
 *       - in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 }, description: Number of results per page
 *       - in: query, name: cursor, schema: { type: string, format: date-time }, description: Pagination cursor (ISO date by createdAt)
 *     responses:
 *       200:
 *         description: Feedbacks retrieved successfully
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
    const { storyId, userId, status, starsGte, limit = 20, cursor } = req.query;
    const pageSize = Math.min(parseInt(limit) || 20, 100);

    // Build filter
    const filter = {};
    
    if (storyId) {
      filter.storyId = storyId;
    }
    
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return err(res, "BAD_REQUEST", "userId");
      }
      filter.userId = userId;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (starsGte) {
      const stars = parseInt(starsGte);
      if (stars < 1 || stars > 5) {
        return err(res, "BAD_REQUEST", "starsGte");
      }
      filter.stars = { $gte: stars };
    }
    
    if (cursor) {
      filter.createdAt = { $lt: new Date(cursor) };
    }

    // Query with limit + 1 to check for more results
    const feedbacks = await Feedback.find(filter)
      .select('_id userId storyId stars text status createdAt')
      .sort({ createdAt: -1 })
      .limit(pageSize + 1)
      .lean();

    const hasMore = feedbacks.length > pageSize;
    const items = hasMore ? feedbacks.slice(0, pageSize) : feedbacks;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return ok(res, { items, nextCursor });
  } catch (error) {
    console.error("Admin feedbacks list error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/feedbacks:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new feedback
 *     description: Create a new feedback entry (for moderation/test purposes)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [storyId, userId, stars, text]
 *             properties:
 *               storyId: { type: string, example: "story_dorian_gray" }
 *               userId: { type: string, example: "68badfecd69761f15d790d09" }
 *               stars: { type: integer, minimum: 1, maximum: 5, example: 4 }
 *               text: { type: string, maxLength: 1000, example: "Great story with interesting characters" }
 *     responses:
 *       200:
 *         description: Feedback created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 feedbackId: { type: string, example: "68badfecd69761f15d790d09" }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 */
router.post("/", async (req, res) => {
  try {
    const { storyId, userId, stars, text } = req.body;

    if (!storyId || !userId || !stars || text === undefined) {
      return err(res, "BAD_REQUEST");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return err(res, "BAD_REQUEST", "userId");
    }

    if (stars < 1 || stars > 5) {
      return err(res, "BAD_REQUEST", "stars");
    }

    const feedback = new Feedback({
      storyId,
      userId,
      stars,
      text: text?.trim() || ""
    });

    await feedback.save();

    // Log admin action
    await logEvent({
      type: "admin.feedbacks.create",
      userId: req.userId,
      meta: { targetFeedbackId: feedback._id, storyId, targetUserId: userId, stars },
      level: "info"
    });

    return ok(res, { feedbackId: feedback._id });
  } catch (error) {
    console.error("Admin feedback create error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/feedbacks/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update feedback details
 *     description: Update feedback stars and text
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: id, required: true, schema: { type: string }, description: Feedback ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stars: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               text: { type: string, maxLength: 1000, example: "Updated review text" }
 *     responses:
 *       200:
 *         description: Feedback updated successfully
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
    const { stars, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, "BAD_REQUEST", "id");
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return err(res, "NOT_FOUND");
    }

    const originalData = { stars: feedback.stars, text: feedback.text };
    const changes = {};

    if (stars !== undefined) {
      if (stars < 1 || stars > 5) {
        return err(res, "BAD_REQUEST", "stars");
      }
      feedback.stars = stars;
      changes.stars = stars;
    }

    if (text !== undefined) {
      feedback.text = text?.trim() || "";
      changes.text = feedback.text;
    }

    await feedback.save();

    // Log admin action with diff
    await logEvent({
      type: "admin.feedbacks.update",
      userId: req.userId,
      meta: { targetFeedbackId: id, changes, original: originalData },
      level: "info"
    });

    return ok(res);
  } catch (error) {
    console.error("Admin feedback update error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/feedbacks/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update feedback status
 *     description: Change feedback status to visible, hidden, or flagged
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: id, required: true, schema: { type: string }, description: Feedback ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [visible, hidden, flagged], example: "flagged" }
 *     responses:
 *       200:
 *         description: Feedback status updated successfully
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
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, "BAD_REQUEST", "id");
    }

    if (!["visible", "hidden", "flagged"].includes(status)) {
      return err(res, "BAD_REQUEST", "status");
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return err(res, "NOT_FOUND");
    }

    const oldStatus = feedback.status;
    feedback.status = status;
    await feedback.save();

    // Log admin action
    await logEvent({
      type: "admin.feedbacks.status",
      userId: req.userId,
      meta: { targetFeedbackId: id, oldStatus, newStatus: status },
      level: "info"
    });

    return ok(res);
  } catch (error) {
    console.error("Admin feedback status update error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/feedbacks/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Soft delete feedback
 *     description: Mark feedback as deleted (soft delete)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: id, required: true, schema: { type: string }, description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, "BAD_REQUEST", "id");
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return err(res, "NOT_FOUND");
    }

    feedback.status = "deleted";
    feedback.deletedAt = new Date();
    await feedback.save();

    // Log admin action
    await logEvent({
      type: "admin.feedbacks.delete",
      userId: req.userId,
      meta: { targetFeedbackId: id, storyId: feedback.storyId, targetUserId: feedback.userId },
      level: "info"
    });

    return ok(res);
  } catch (error) {
    console.error("Admin feedback delete error:", error);
    return err(res, "SERVER_ERROR");
  }
});

export default router;
