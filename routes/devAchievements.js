import express from "express";
import { evaluateAndUnlock } from "../services/achievements.js";

const router = express.Router();

function ok(res, data) { return res.json(data); }
function err(res, code = 500, name = "SERVER_ERROR", field) {
  const body = field ? { error: name, field } : { error: name };
  return res.status(code).json(body);
}

/**
 * @swagger
 * /api/dev/achievements/tick:
 *   post:
 *     tags: [Dev]
 *     summary: Trigger achievement evaluation (Dev Only)
 *     description: Manually triggers evaluation of achievement unlock conditions for the current user
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storyId:
 *                 type: string
 *                 description: Story ID for context (optional)
 *                 example: "story_dorian_gray"
 *               sessionId:
 *                 type: string
 *                 description: Session ID for context (optional)
 *                 example: "68badfecd69761f15d790d09"
 *     responses:
 *       200:
 *         description: Achievement evaluation completed successfully
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
 *                       description: Number of new achievements unlocked
 *                       example: 1
 *                 unlocked:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of achievement codes that were unlocked
 *                   example: ["first_completion"]
 *       400:
 *         description: Bad request - invalid parameters
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
 *                   example: "storyId"
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
