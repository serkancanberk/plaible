import express from "express";
import { buildForUser, upsertMessages } from "../services/engagementRules.js";

const router = express.Router();

function ok(res, data) { return res.json(data); }
function err(res, code = 500, name = "SERVER_ERROR", field) {
  const body = field ? { error: name, field } : { error: name };
  return res.status(code).json(body);
}

/**
 * @swagger
 * /api/dev/engagement/tick:
 *   post:
 *     tags: [Dev]
 *     summary: Trigger engagement rule evaluation (Dev Only)
 *     description: Manually triggers evaluation of re-engagement rules for the current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Engagement rules evaluated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 counts:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: integer
 *                       description: Number of new engagement messages created
 *                       example: 1
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
