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
import { Event } from "./models/Event.js";
import { attachRequestId, notFoundHandler, globalErrorHandler } from "./middleware/errors.js";
import inboxRouter from "./routes/inbox.js";
import devEngagementRouter from "./routes/devEngagement.js";

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
app.use(passport.initialize());

// Global rate limiter on /api
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
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
      // fall through to dev fallback below
    }
  }
  if (process.env.NODE_ENV === "development" && process.env.DEV_FAKE_USER === "1" && !req.userId) {
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

// Dev events endpoint (read-only, auth-protected)
app.get("/api/dev/events", authGuard, async (req, res) => {
  try {
    const { type, limit = 50, cursor } = req.query;
    
    // Validate limit
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    
    // Build query
    const query = { userId: req.userId };
    if (type) {
      query.type = type;
    }
    if (cursor) {
      query._id = { $lt: cursor };
    }
    
    // Fetch events (newest first)
    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit + 1)
      .lean();
    
    // Check if there are more events
    const hasMore = events.length > parsedLimit;
    if (hasMore) {
      events.pop(); // Remove the extra event
    }
    
    // Get next cursor
    const nextCursor = hasMore ? events[events.length - 1]?._id : undefined;
    
    res.json({
      ok: true,
      items: events,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error("[dev/events] error:", error);
    res.status(500).json({ error: "SERVER_ERROR" });
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