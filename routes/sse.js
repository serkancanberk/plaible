import express from "express";
import mongoose from "mongoose";
import { Session } from "../models/Session.js";
import { addClient, removeClient } from "../middleware/memorySSE.js";
import { logEvent } from "../services/eventLog.js";

const router = express.Router();

function isObjectId(v) { 
  try { 
    return mongoose.Types.ObjectId.isValid(String(v)); 
  } catch { 
    return false; 
  } 
}

/**
 * @swagger
 * /api/sse/session/{id}:
 *   get:
 *     tags: [SSE]
 *     summary: Connect to session SSE stream
 *     description: Establishes a Server-Sent Events connection for real-time updates on a specific session
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *         example: "68badfecd69761f15d790d09"
 *     responses:
 *       200:
 *         description: SSE connection established successfully
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: Server-Sent Events stream
 *               example: |
 *                 data: {"kind":"hello","sessionId":"68badfecd69761f15d790d09","ts":"2025-09-07T15:30:00.000Z"}
 *                 
 *                 data: {"kind":"scene","scene":{"text":"You enter the room...","choices":["Look around","Leave"]},"progress":{"chapter":1,"completed":false},"ts":"2025-09-07T15:30:05.000Z"}
 *                 
 *       400:
 *         description: Bad request - invalid session ID
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
 *         description: Session not found or not accessible
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
// GET /api/sse/session/:id
router.get("/session/:id", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }

    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ error: "BAD_REQUEST", field: "id" });
    }

    // Validate session exists, is owned by user, and not completed
    const session = await Session.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
      "progress.completed": false
    }).lean();

    if (!session) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }

    // Add client to SSE registry
    addClient(id, res);

    // Log connection event
    logEvent({
      type: "sse.client_connected",
      userId,
      meta: { sessionId: id }
    }).catch(() => {}); // best-effort, never throws

    // Send hello event
    const helloEvent = {
      kind: "hello",
      sessionId: id,
      ts: new Date().toISOString()
    };
    
    res.write(`data: ${JSON.stringify(helloEvent)}\n\n`);

    // Handle client disconnect
    res.on('close', () => {
      removeClient(id, res);
      logEvent({
        type: "sse.client_disconnected",
        userId,
        meta: { sessionId: id }
      }).catch(() => {}); // best-effort, never throws
    });

    res.on('error', () => {
      removeClient(id, res);
      logEvent({
        type: "sse.client_disconnected",
        userId,
        meta: { sessionId: id }
      }).catch(() => {}); // best-effort, never throws
    });

  } catch (error) {
    console.error("[sse] error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "SERVER_ERROR" });
    }
  }
});

export default router;
