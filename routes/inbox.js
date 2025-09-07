import express from "express";
import mongoose from "mongoose";
import { EngagementMessage } from "../models/EngagementMessage.js";

function isObjectId(v) { try { return mongoose.Types.ObjectId.isValid(String(v)); } catch { return false; } }

const router = express.Router();

function ok(res, data) { return res.json(data); }
function err(res, code = 500, name = "SERVER_ERROR", field) {
  const body = field ? { error: name, field } : { error: name };
  return res.status(code).json(body);
}

/**
 * @swagger
 * /api/inbox:
 *   get:
 *     tags: [Inbox]
 *     summary: Get user's engagement messages
 *     description: Retrieves paginated list of re-engagement messages for the user
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Maximum number of messages to return
 *         example: 20
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO date string for pagination cursor
 *         example: "2025-09-07T15:30:00.000Z"
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "68badfecd69761f15d790d09"
 *                       ruleId:
 *                         type: string
 *                         example: "rule123"
 *                       type:
 *                         type: string
 *                         example: "lowCredits"
 *                       title:
 *                         type: string
 *                         example: "Low Credits"
 *                       body:
 *                         type: string
 *                         example: "Hi there, you have low credits!"
 *                       cta:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                             example: "Top up"
 *                           action:
 *                             type: string
 *                             example: "topup"
 *                           params:
 *                             type: object
 *                       status:
 *                         type: string
 *                         example: "unread"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-07T15:30:00.000Z"
 *                 nextCursor:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: ISO date string for next page cursor, null if no more pages
 *                   example: "2025-09-07T15:25:00.000Z"
 *       401:
 *         description: Unauthenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "UNAUTHENTICATED"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "SERVER_ERROR"
 */
// GET /api/inbox?limit=&cursor=
router.get("/", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return err(res, 401, "UNAUTHENTICATED");

    const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);
    const cursor = req.query.cursor;
    const q = { userId: new mongoose.Types.ObjectId(userId) };
    if (cursor) q.createdAt = { $lt: new Date(cursor) };

    const items = await EngagementMessage.find(q)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    const nextCursor = hasMore ? items[items.length - 1]?.createdAt?.toISOString() : null;

    return ok(res, { items, nextCursor });
  } catch (e) {
    return err(res, 500, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/inbox/{id}/read:
 *   post:
 *     tags: [Inbox]
 *     summary: Mark message as read
 *     description: Marks an engagement message as read
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *         example: "68badfecd69761f15d790d09"
 *     responses:
 *       200:
 *         description: Message marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - invalid message ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "BAD_REQUEST"
 *                 field:
 *                   type: string
 *                   example: "id"
 *       401:
 *         description: Unauthenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "UNAUTHENTICATED"
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "NOT_FOUND"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "SERVER_ERROR"
 */
// POST /api/inbox/:id/read
router.post("/:id/read", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return err(res, 401, "UNAUTHENTICATED");

    const { id } = req.params;
    if (!isObjectId(id)) return err(res, 400, "BAD_REQUEST", "id");
    
    const upd = await EngagementMessage.updateOne(
      { _id: id, userId },
      { $set: { status: "read" } }
    );
    if (upd.matchedCount === 0) return err(res, 404, "NOT_FOUND");
    return ok(res, {});
  } catch {
    return err(res, 500, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/inbox/{id}/archive:
 *   post:
 *     tags: [Inbox]
 *     summary: Archive message
 *     description: Archives an engagement message
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *         example: "68badfecd69761f15d790d09"
 *     responses:
 *       200:
 *         description: Message archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - invalid message ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "BAD_REQUEST"
 *                 field:
 *                   type: string
 *                   example: "id"
 *       401:
 *         description: Unauthenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "UNAUTHENTICATED"
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "NOT_FOUND"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "SERVER_ERROR"
 */
// POST /api/inbox/:id/archive
router.post("/:id/archive", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return err(res, 401, "UNAUTHENTICATED");

    const { id } = req.params;
    if (!isObjectId(id)) return err(res, 400, "BAD_REQUEST", "id");
    
    const upd = await EngagementMessage.updateOne(
      { _id: id, userId },
      { $set: { status: "archived" } }
    );
    if (upd.matchedCount === 0) return err(res, 404, "NOT_FOUND");
    return ok(res, {});
  } catch {
    return err(res, 500, "SERVER_ERROR");
  }
});

export default router;
