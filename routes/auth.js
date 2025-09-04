import { Router } from "express";
import passport from "passport";
import "../auth/passport.js";
import { signJwt, verifyJwt } from "../auth/config.js";
const FE_ORIGIN = process.env.FE_ORIGIN || "/";
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";
const FORCE_SECURE_COOKIE = String(process.env.FORCE_SECURE_COOKIE || "").toLowerCase() === "true";
import { User } from "../models/User.js";
import passportCore from "passport";

const router = Router();

// Failure JSON endpoint
router.get('/failure', (req, res) => {
  return res.status(401).json({ ok: false, error: 'oauth_failed' });
});

// Health/ping
router.get("/ping", (req, res) => {
  const token = req.cookies?.plaible_jwt;
  let userId = null;
  if (token) {
    try {
      const decoded = verifyJwt(token);
      userId = decoded?.sub || decoded?._id || null;
    } catch (_) {}
  }
  res.json({ ok: true, userId: userId || null });
});

// Debug: confirm strategy presence at mount time (guarded)
if (process.env.NODE_ENV === "development" && process.env.AUTH_DEBUG === "1") {
  console.log("[auth] mounting /api/auth/google, strategy present:", !!passportCore._strategies?.google);
}

// Google OAuth start
router.get("/google", (req, res, next) => {
  if (process.env.NODE_ENV === "development" && process.env.AUTH_DEBUG === "1") {
    console.log("[auth] HIT /api/auth/google");
  }
  const forceConsent =
    String(process.env.GOOGLE_FORCE_CONSENT || "").toLowerCase() === "true" ||
    req.query.force === "1";
  const opts = {
    scope: ["profile", "email"],
  };
  if (forceConsent) {
    // Force Google’s consent screen every time
    opts.prompt = "consent";
    // Optional: get refresh token in real app flows
    // opts.accessType = "offline";
    // opts.includeGrantedScopes = true;
  }
  return passport.authenticate("google", opts)(req, res, next);
});

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/failure" }),
  (req, res) => {
    try {
      const token = signJwt({ sub: req.user._id.toString() });
      const cookieOpts = {
        httpOnly: true,
        sameSite: isProduction ? "lax" : "lax",
        secure: isProduction || FORCE_SECURE_COOKIE,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      };
      res.cookie("plaible_jwt", token, cookieOpts);
      return res.redirect(FE_ORIGIN);
    } catch (e) {
      console.error("JWT issue in callback", e);
      return res.redirect("/api/auth/failure");
    }
  }
);

// Current user
router.get("/me", async (req, res) => {
  const token = req.cookies?.plaible_jwt;
  if (!token) return res.status(401).json({ error: "UNAUTHENTICATED" });
  try {
    const decoded = verifyJwt(token);
    const userId = decoded?.sub || decoded?.uid;
    if (!userId) return res.status(401).json({ error: "INVALID_TOKEN" });
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });
    const safe = {
      _id: user._id,
      email: user.email,
      profilePictureUrl: user.profilePictureUrl,
      identity: user.identity || { displayName: user.displayName },
      wallet: { balance: user.wallet?.balance ?? 0 },
    };
    res.json(safe);
  } catch (err) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  const cookieOpts = {
    httpOnly: true,
    sameSite: isProduction ? "lax" : "lax",
    secure: isProduction || FORCE_SECURE_COOKIE,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
  res.clearCookie("plaible_jwt", { ...cookieOpts });
  return res.json({ ok: true });
});

// GET alias for logout (dev convenience)
router.get('/logout', (req, res) => {
  const cookieOpts = {
    httpOnly: true,
    sameSite: isProduction ? "lax" : "lax",
    secure: isProduction || FORCE_SECURE_COOKIE,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
  res.clearCookie('plaible_jwt', { ...cookieOpts });
  return res.json({ ok: true });
});

export default router;


