import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import passport from "passport";
import { verifyJwt, isProduction } from "./auth/config.js";
import "./auth/passport.js";
import { User } from "./models/User.js";
import authRouter from "./routes/auth.js";
import storiesRouter from "./routes/stories.js";
import sessionsRouter from "./routes/sessions.js";
import walletRouter from "./routes/wallet.js";
import feedbacksRouter from "./routes/feedbacks.js";

dotenv.config();

const app = express();

// Middleware
const FE_ORIGIN = process.env.FE_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: FE_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

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
app.use("/api/stories", authGuard, storiesRouter);

// Sessions router
app.use("/api/sessions", authGuard, sessionsRouter);

// Wallet router
app.use("/api/wallet", authGuard, walletRouter);

// Feedbacks router
app.use("/api/feedbacks", authGuard, feedbacksRouter);

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plaible";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});