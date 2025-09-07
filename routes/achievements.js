import express from "express";
import { listUnlocked, getStats } from "../services/achievements.js";

const router = express.Router();

function ok(res, data) { return res.json(data); }
function err(res, code = 500, name = "SERVER_ERROR", field) {
  const body = field ? { error: name, field } : { error: name };
  return res.status(code).json(body);
}

/**
 * @swagger
 * /api/achievements:
 *   get:
 *     tags: [Achievements]
 *     summary: Get user's unlocked achievements
 *     description: Retrieves paginated list of achievements unlocked by the user
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of achievements to return
 *         example: 50
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO date string for pagination cursor
 *         example: "2025-09-07T15:30:00.000Z"
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "first_completion"
 *                       name:
 *                         type: string
 *                         example: "First Completion"
 *                       description:
 *                         type: string
 *                         example: "Complete your first story"
 *                       unlockedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-07T15:30:00.000Z"
 *                       icon:
 *                         type: string
 *                         nullable: true
 *                         example: "🏆"
 *                       category:
 *                         type: string
 *                         example: "progress"
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
