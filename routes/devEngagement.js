import express from "express";
import { buildForUser, upsertMessages } from "../services/engagementRules.js";

const router = express.Router();

function ok(res, data) { return res.json(data); }
function err(res, code = 500, name = "SERVER_ERROR", field) {
  const body = field ? { error: name, field } : { error: name };
  return res.status(code).json(body);
}

// POST /api/dev/engagement/tick
router.post("/tick", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return err(res, 401, "UNAUTHENTICATED");

    const msgs = await buildForUser(userId);
    const { created } = await upsertMessages(userId, msgs);
    return ok(res, { counts: { created } });
  } catch {
    return err(res, 500, "SERVER_ERROR");
  }
});

export default router;
