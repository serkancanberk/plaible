import express from "express";
import { tickDaily, getOverview, getStories } from "../../services/analytics.js";
import { logEvent } from "../../services/eventLog.js";

const router = express.Router();

// Helper functions
const ok = (res, data) => res.json({ ok: true, ...data });
const err = (res, code, field = null) => {
  const response = { error: code };
  if (field) response.field = field;
  return res.status(code === "BAD_REQUEST" ? 400 : code === "NOT_FOUND" ? 404 : 500).json(response);
};

// Feature flag for dev-only admin actions
const DEV_ONLY = process.env.DEV_ONLY_ADMIN_ACTIONS === "true";

/**
 * @swagger
 * /api/admin/analytics/tick:
 *   post:
 *     tags: [Admin]
 *     summary: Run daily analytics aggregation
 *     description: Process events for a specific date and generate daily analytics
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query, name: date, schema: { type: string, format: date }, description: Date in YYYY-MM-DD format (defaults to today)
 *     responses:
 *       200:
 *         description: Analytics tick completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 date: { type: string, example: "2025-09-07" }
 *                 eventsProcessed: { type: integer, example: 150 }
 *                 dau: { type: integer, example: 25 }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 */
router.post("/tick", async (req, res) => {
  try {
    const { date } = req.query;

    // Validate date format if provided
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return err(res, "BAD_REQUEST", "date");
    }

    const result = await tickDaily({ date });

    // Log admin action
    await logEvent({
      type: "admin.analytics.tick",
      userId: req.userId,
      meta: { date: result.date, eventsProcessed: result.eventsProcessed, dau: result.dau },
      level: "info"
    });

    return ok(res, { 
      date: result.date, 
      eventsProcessed: result.eventsProcessed,
      dau: result.dau,
      sessionsStarted: result.sessionsStarted,
      turns: result.turns,
      completions: result.completions
    });
  } catch (error) {
    console.error("Admin analytics tick error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/analytics/overview:
 *   get:
 *     tags: [Admin]
 *     summary: Get analytics overview
 *     description: Retrieve analytics overview with time series data and totals for a specified period
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query, name: period, schema: { type: string, enum: [7d, 30d], default: 7d }, description: Time period for analytics
 *     responses:
 *       200:
 *         description: Analytics overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 series: { type: array, items: { type: object, properties: { date: { type: string }, dau: { type: integer }, turns: { type: integer }, completions: { type: integer }, walletTopups: { type: integer }, creditsPurchased: { type: integer }, moderationBlocked: { type: integer } } } }
 *                 totals: { type: object, properties: { dau: { type: integer }, turns: { type: integer }, completions: { type: integer }, walletTopups: { type: integer }, creditsPurchased: { type: integer }, moderationBlocked: { type: integer } } }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 */
router.get("/overview", async (req, res) => {
  try {
    const { period = "7d" } = req.query;

    if (!["7d", "30d"].includes(period)) {
      return err(res, "BAD_REQUEST", "period");
    }

    const result = await getOverview({ period });

    return ok(res, result);
  } catch (error) {
    console.error("Admin analytics overview error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/analytics/stories:
 *   get:
 *     tags: [Admin]
 *     summary: Get story analytics
 *     description: Retrieve analytics breakdown by story for a specified period
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query, name: period, schema: { type: string, enum: [7d, 30d], default: 7d }, description: Time period for analytics
 *     responses:
 *       200:
 *         description: Story analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 items: { type: array, items: { type: object, properties: { storyId: { type: string }, starts: { type: integer }, turns: { type: integer }, completions: { type: integer }, completionRate: { type: number } } } }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 */
router.get("/stories", async (req, res) => {
  try {
    const { period = "7d" } = req.query;

    if (!["7d", "30d"].includes(period)) {
      return err(res, "BAD_REQUEST", "period");
    }

    const result = await getStories({ period });

    return ok(res, result);
  } catch (error) {
    console.error("Admin analytics stories error:", error);
    return err(res, "SERVER_ERROR");
  }
});

export default router;
