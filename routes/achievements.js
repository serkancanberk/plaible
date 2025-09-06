import express from "express";
import { listUnlocked, getStats } from "../services/achievements.js";

const router = express.Router();

function ok(res, data) { return res.json(data); }
function err(res, code = 500, name = "SERVER_ERROR", field) {
  const body = field ? { error: name, field } : { error: name };
  return res.status(code).json(body);
}

// GET /api/achievements
router.get("/", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return err(res, 401, "UNAUTHENTICATED");

    const { limit = 50, cursor } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    
    const items = await listUnlocked(userId, { limit: parsedLimit, cursor });
    return ok(res, { items });
  } catch (error) {
    console.error("[achievements] error:", error);
    return err(res, 500, "SERVER_ERROR");
  }
});


export default router;
