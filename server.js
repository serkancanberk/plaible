import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import passport from "passport";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { verifyJwt, isProduction } from "./auth/config.js";
import "./auth/passport.js";
import { User } from "./models/User.js";
import authRouter from "./routes/auth.js";
import storiesRouter from "./routes/stories.js";
import sessionsRouter from "./routes/sessions.js";
import walletRouter from "./routes/wallet.js";
import feedbacksRouter from "./routes/feedbacks.js";
import { publicFeedbacksRouter } from "./routes/feedbacks.js";
import savesRouter from "./routes/saves.js";
import storyrunnerRouter from "./routes/storyrunner.js";
import categoryConfigRouter from "./routes/categoryConfig.js";
import { Event } from "./models/Event.js";
import { attachRequestId, notFoundHandler, globalErrorHandler } from "./middleware/errors.js";
import { requestLogger } from "./middleware/requestLogger.js";
import inboxRouter from "./routes/inbox.js";
import devEngagementRouter from "./routes/devEngagement.js";
import achievementsRouter from "./routes/achievements.js";
import devAchievementsRouter from "./routes/devAchievements.js";
import sseRouter from "./routes/sse.js";
import { swaggerSpec, swaggerUi, swaggerOpts } from "./docs/swagger.js";
import adminGuard from "./middleware/adminGuard.js";
import adminUsersRouter from "./routes/admin/users.js";
import adminStoriesRouter from "./routes/admin/stories.js";
import adminFeedbacksRouter from "./routes/admin/feedbacks.js";
import adminAnalyticsRouter from "./routes/admin/analytics.js";
import adminWalletAnalyticsRouter from "./routes/admin/walletAnalytics.js";
import adminStoryRunnerRouter from "./routes/admin/storyRunner.js";
import adminBriefRouter from "./routes/admin/brief.js";
import uploadRouter from "./routes/upload.js";
import storyRunnerRoutes from "./routes/storyRunnerRoutes.js";

const { ObjectId } = mongoose.Types;

// Helper functions for consistent responses
function ok(res, data) { return res.json(data); }
function err(res, code = 500, name = "SERVER_ERROR", field) {
  const body = field ? { error: name, field } : { error: name };
  return res.status(code).json(body);
}

dotenv.config();

const app = express();

// Env toggles & helpers
const NODE_ENV = process.env.NODE_ENV || "development";
const FE_ORIGIN = process.env.FE_ORIGIN || "http://localhost:5173";
const FORCE_SECURE_COOKIE = String(process.env.FORCE_SECURE_COOKIE || "").toLowerCase() === "true";
const TRUST_PROXY = String(process.env.TRUST_PROXY || "").toLowerCase() === "true";
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 120);

if (TRUST_PROXY) app.set("trust proxy", 1);

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: FE_ORIGIN,
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(express.json());
app.use(attachRequestId);
app.use(requestLogger);
app.use(passport.initialize());

// Global rate limiter on /api - disabled in development, more lenient in production
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: NODE_ENV === "development" ? 10000 : RATE_LIMIT_MAX, // Very high limit in dev, normal in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TOO_MANY_REQUESTS",
    message: "Too many requests, please try again later."
  },
  skip: (req) => {
    // Skip rate limiting in development
    return NODE_ENV === "development";
  }
});
app.use("/api", apiLimiter);

// Simple route
app.get("/", (req, res) => {
  res.send("Plaible API is running...");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

// Auth guard: prefer cookie JWT; fallback to dev fixed user
const devFallbackUserId = new mongoose.Types.ObjectId("64b7cafe1234567890cafe12");
export function authGuard(req, res, next) {
  const token = req.cookies?.plaible_jwt;
  if (token) {
    try {
      const decoded = verifyJwt(token);
      req.userId = decoded?.sub || decoded?.uid || decoded?._id;
      return next();
    } catch (err) {
      console.log("JWT verification failed", err.message);
      // fall through to dev fallback below
    }
  }
  
  // In development, use dev fallback user if no valid token
  if ((NODE_ENV === "development" || !NODE_ENV) && !req.userId) {
    console.log("Using dev fallback user for development");
    req.userId = devFallbackUserId;
    return next();
  }
  
  return res.status(401).json({ error: "UNAUTHENTICATED" });
}

// Users router
const usersRouter = express.Router();
usersRouter.get("/test", (req, res) => {
  res.json({ message: "User route works" });
});
app.use("/api/users", usersRouter);

// Auth router
app.use("/api/auth", authRouter);

// Stories router
// Public browsing per Blueprint
app.use("/api/stories", storiesRouter);

// Sessions router
app.use("/api/sessions", authGuard, sessionsRouter);

// StoryRunner router
app.use("/api/storyrunner", authGuard, storyrunnerRouter);

// Story Runner Routes (new AI-powered storytelling)
app.use("/api/story", authGuard, storyRunnerRoutes);

// Wallet router
app.use("/api/wallet", authGuard, walletRouter);

// Feedbacks router
// Public listing for story feedbacks (GET only)
app.use("/api/feedbacks", publicFeedbacksRouter);
// Auth-protected feedback endpoints (POST upsert, etc.)
app.use("/api/feedbacks", authGuard, feedbacksRouter);
app.use("/api/saves", authGuard, savesRouter);

// Inbox router
app.use("/api/inbox", authGuard, inboxRouter);

// Dev engagement router
app.use("/api/dev/engagement", authGuard, devEngagementRouter);

// Achievements router
app.use("/api/achievements", authGuard, achievementsRouter);

/**
 * @swagger
 * /api/stats:
 *   get:
 *     tags: [Achievements]
 *     summary: Get user statistics
 *     description: Retrieves user statistics including achievements and session data
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalSessions:
 *                       type: integer
 *                       example: 5
 *                     completedSessions:
 *                       type: integer
 *                       example: 3
 *                     totalAchievements:
 *                       type: integer
 *                       example: 2
 *                     recentAchievements:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             type: string
 *                             example: "first_completion"
 *                           name:
 *                             type: string
 *                             example: "First Completion"
 *                           unlockedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-09-07T15:30:00.000Z"
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
// Stats endpoint
app.get("/api/stats", authGuard, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const { getStats } = await import("./services/achievements.js");
    const stats = await getStats(userId);
    return res.json(stats);
  } catch (error) {
    console.error("[stats] error:", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// Dev achievements router
app.use("/api/dev/achievements", authGuard, devAchievementsRouter);

// SSE router
app.use("/api/sse", authGuard, sseRouter);

// Admin routers (require authGuard + adminGuard)
app.use("/api/admin/users", authGuard, adminGuard, adminUsersRouter);
app.use("/api/admin/stories", authGuard, adminGuard, adminStoriesRouter);
app.use("/api/admin/feedbacks", authGuard, adminGuard, adminFeedbacksRouter);
app.use("/api/admin/analytics", authGuard, adminGuard, adminAnalyticsRouter);
app.use("/api/admin/wallet", authGuard, adminGuard, adminWalletAnalyticsRouter);
app.use("/api/admin/storyrunner", authGuard, adminGuard, adminStoryRunnerRouter);
app.use("/api/admin/brief", authGuard, adminGuard, adminBriefRouter);
app.use("/api/category-config", categoryConfigRouter);
app.use("/api/upload", authGuard, uploadRouter);

// Serve uploaded media files
app.use("/uploads", express.static("uploads"));

// Swagger UI documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOpts));

// OpenAPI JSON endpoint
app.get("/api/docs.json", (_, res) => res.json(swaggerSpec));

/**
 * @swagger
 * /api/dev/events:
 *   get:
 *     tags: [Dev]
 *     summary: Get event logs (Dev Only)
 *     description: Retrieves paginated event logs with optional filtering
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID to filter events (use "me" for current user, or ObjectId for specific user)
 *         example: "me"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Comma-separated list of event types to filter
 *         example: "session.started,wallet.deducted"
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO date string for pagination cursor
 *         example: "2025-09-07T15:30:00.000Z"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of events to return
 *         example: 20
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "68badfecd69761f15d790d09"
 *                       type:
 *                         type: string
 *                         example: "session.started"
 *                       userId:
 *                         type: string
 *                         example: "68badfecd69761f15d790d10"
 *                       meta:
 *                         type: object
 *                         example: {"sessionId": "68badfecd69761f15d790d11"}
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
// Dev events endpoint (read-only, auth-protected)
app.get("/api/dev/events", authGuard, async (req, res) => {
  try {
    const { userId, type, limit, cursor } = req.query;
    
    // Validate limit
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);
    
    // Build filter
    const filter = {};
    
    // Handle userId
    if (userId === "me") {
      filter.userId = req.userId;
    } else if (userId) {
      if (!ObjectId.isValid(userId)) {
        return err(res, 400, "BAD_REQUEST", "userId");
      }
      filter.userId = new ObjectId(userId);
    }
    // If no userId query is provided, do not set filter.userId (default → all events)
    
    // Handle type
    if (type) {
      const types = type.split(',').map(t => t.trim()).filter(t => t.length > 0);
      if (types.length > 0) {
        filter.type = { $in: types };
      }
    }
    
    // Handle cursor
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (isNaN(cursorDate.getTime())) {
        return err(res, 400, "BAD_REQUEST", "cursor");
      }
      filter.createdAt = { $lt: cursorDate };
    }
    
    // Query events
    const items = await Event.find(filter)
      .sort({ createdAt: -1 })
      .limit(pageSize + 1)
      .lean();
    
    // Check if there are more events
    const hasMore = items.length > pageSize;
    if (hasMore) {
      items.pop(); // Remove the extra event
    }
    
    // Get next cursor
    const nextCursor = hasMore ? items[items.length - 1]?.createdAt?.toISOString() || null : null;
    
    return ok(res, { ok: true, items, nextCursor, hasMore });
  } catch (error) {
    console.error("[dev/events] error:", error);
    return err(res, 500, "SERVER_ERROR");
  }
});

// 404 handler for API routes
app.use("/api", notFoundHandler);

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plaible";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Global error handler (must be last)
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});