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
