import express from "express";
import { evaluateAndUnlock } from "../services/achievements.js";

const router = express.Router();

function ok(res, data) { return res.json(data); }
function err(res, code = 500, name = "SERVER_ERROR", field) {
  const body = field ? { error: name, field } : { error: name };
  return res.status(code).json(body);
}

// POST /api/dev/achievements/tick
router.post("/tick", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return err(res, 401, "UNAUTHENTICATED");

    const { storyId, sessionId } = req.body || {};
    
    // Basic validation
    if (storyId && typeof storyId !== "string") {
      return err(res, 400, "BAD_REQUEST", "storyId");
    }
    if (sessionId && typeof sessionId !== "string") {
      return err(res, 400, "BAD_REQUEST", "sessionId");
    }

    const result = await evaluateAndUnlock({ userId, storyId, sessionId });
    return ok(res, { counts: { created: result.created }, unlocked: result.unlocked });
  } catch (error) {
    console.error("[dev/achievements/tick] error:", error);
    return err(res, 500, "SERVER_ERROR");
  }
});

export default router;
