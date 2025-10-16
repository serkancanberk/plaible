import { Router } from "express";
import passport from "passport";
import "../auth/passport.js";
import { signJwt, verifyJwt } from "../auth/config.js";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import passportCore from "passport";

// Environment variables
const FE_ORIGIN = process.env.FE_ORIGIN || "/";
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";
const FORCE_SECURE_COOKIE = String(process.env.FORCE_SECURE_COOKIE || "").toLowerCase() === "true";

// Frontend URLs from environment
const PUBLIC_FRONTEND_URL = process.env.PUBLIC_FRONTEND_URL || "http://localhost:5173";
const ADMIN_FRONTEND_URL = process.env.ADMIN_FRONTEND_URL || "http://localhost:5174/admin.html#/users";

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
  
  // Store redirect URL for after authentication
  const redirectUrl = req.query.redirect || '/app';
  req.session = req.session || {};
  req.session.oauthRedirect = redirectUrl;
  
  const forceConsent =
    String(process.env.GOOGLE_FORCE_CONSENT || "").toLowerCase() === "true" ||
    req.query.force === "1";
  const opts = {
    scope: ["profile", "email"],
  };
  if (forceConsent) {
    // Force Google's consent screen every time
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
  async (req, res) => {
    try {
      const user = req.user;
      const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin');
      const storedRedirect = req.session?.oauthRedirect;
      const PUBLIC_FRONTEND_URL =
        process.env.PUBLIC_FRONTEND_URL || 'http://localhost:5173';
      const ADMIN_FRONTEND_URL =
        process.env.ADMIN_FRONTEND_URL || 'http://localhost:5174/admin.html#/users';

      console.log('============================');
      console.log('🎯 [OAUTH CALLBACK TRIGGERED]');
      console.log('User:', user.email);
      console.log('Roles:', user.roles);
      console.log('Stored Redirect:', storedRedirect);
      console.log('============================');

      // clear session redirect
      if (req.session) delete req.session.oauthRedirect;

      // generate JWT for user
      const token = signJwt({ 
        sub: user._id.toString(),
        email: user.email,
        name: user.identity?.displayName || user.fullName,
        role: isAdmin ? 'admin' : 'user'
      }, { expiresIn: isAdmin ? '1h' : '7d' });

      // set appropriate cookie
      if (isAdmin) {
        res.cookie('admin_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 1000, // 1 hour
        });

        console.log('✅ Redirecting admin user to:', ADMIN_FRONTEND_URL);
        return res.redirect(ADMIN_FRONTEND_URL);
      } else {
        res.cookie('plaible_jwt', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const redirectPath =
          storedRedirect && storedRedirect.startsWith('/app')
            ? storedRedirect
            : '/app';
        const redirectUrl = `${PUBLIC_FRONTEND_URL}${redirectPath}`;

        console.log('🌍 Redirecting public user to:', redirectUrl);
        return res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('❌ [OAUTH CALLBACK ERROR]', error);
      return res.redirect('/api/auth/failure');
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
    
    console.log('[AUTH_ME] Returning user data:', {
      email: safe.email,
      profilePictureUrl: safe.profilePictureUrl,
      hasProfilePicture: !!safe.profilePictureUrl
    });
    
    res.json(safe);
  } catch (err) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
});

// Admin authentication check
router.get("/admin/check", (req, res) => {
  const adminToken = req.cookies?.admin_token;
  if (!adminToken) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
  
  try {
    const decoded = verifyJwt(adminToken);
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    
    // Verify the token email matches admin email
    if (decoded.email?.toLowerCase() !== adminEmail) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    
    res.json({
      ok: true,
      user: {
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      }
    });
  } catch (err) {
    console.error("Admin token verification failed:", err);
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
});

// Admin refresh token endpoint
router.post("/admin/refresh", async (req, res) => {
  const refreshToken = req.cookies?.admin_refresh_token;
  
  if (!refreshToken) {
    return res.status(401).json({ error: "NO_REFRESH_TOKEN" });
  }
  
  try {
    // Find and validate the refresh token
    const tokenDoc = await RefreshToken.findAndValidate(refreshToken);
    
    if (!tokenDoc) {
      return res.status(401).json({ error: "INVALID_REFRESH_TOKEN" });
    }
    
    // Verify the user is still the admin
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (tokenDoc.userEmail?.toLowerCase() !== adminEmail) {
      // Revoke the token if user is no longer admin
      await RefreshToken.revokeToken(refreshToken);
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    
    // Issue new access token
    const newAccessToken = signJwt({ 
      sub: tokenDoc.userId._id.toString(),
      email: tokenDoc.userEmail,
      name: tokenDoc.userId.identity?.displayName || tokenDoc.userId.fullName,
      role: 'admin'
    }, { expiresIn: '1h' });
    
    // Set new access token cookie
    const cookieOpts = {
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      secure: isProduction || FORCE_SECURE_COOKIE,
      maxAge: 60 * 60 * 1000, // 1 hour
      path: "/",
    };
    res.cookie("admin_token", newAccessToken, cookieOpts);
    
    console.log("Admin token refreshed for:", tokenDoc.userEmail);
    
    res.json({
      ok: true,
      user: {
        email: tokenDoc.userEmail,
        name: tokenDoc.userId.identity?.displayName || tokenDoc.userId.fullName,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error("Admin refresh token error:", error);
    return res.status(401).json({ error: "REFRESH_FAILED" });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    console.log('👋 User logout initiated');
    
    const cookieOpts = {
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      secure: isProduction || FORCE_SECURE_COOKIE,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };
    
    // Revoke admin refresh token if present
    const adminRefreshToken = req.cookies?.admin_refresh_token;
    if (adminRefreshToken) {
      try {
        await RefreshToken.revokeToken(adminRefreshToken);
        console.log("Admin refresh token revoked on logout");
      } catch (error) {
        console.error("Error revoking admin refresh token:", error);
      }
    }
    
    // Clear all auth cookies
    res.clearCookie("plaible_jwt", { ...cookieOpts });
    res.clearCookie("admin_token", { ...cookieOpts });
    res.clearCookie("admin_refresh_token", { ...cookieOpts });
    res.clearCookie("connect.sid", { httpOnly: true, sameSite: 'lax' });
    
    // Clear session if it exists
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        } else {
          console.log("Session cleared successfully");
        }
      });
    }
    
    console.log('✅ User logged out successfully');
    return res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    console.error('❌ Logout error:', err);
    return res.status(500).json({ message: 'Logout failed' });
  }
});

// GET alias for logout (dev convenience)
router.get('/logout', async (req, res) => {
  const cookieOpts = {
    httpOnly: true,
    sameSite: isProduction ? "strict" : "lax",
    secure: isProduction || FORCE_SECURE_COOKIE,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
  
  // Revoke admin refresh token if present
  const adminRefreshToken = req.cookies?.admin_refresh_token;
  if (adminRefreshToken) {
    try {
      await RefreshToken.revokeToken(adminRefreshToken);
      console.log("Admin refresh token revoked on logout");
    } catch (error) {
      console.error("Error revoking admin refresh token:", error);
    }
  }
  
  res.clearCookie('plaible_jwt', { ...cookieOpts });
  res.clearCookie('admin_token', { ...cookieOpts });
  res.clearCookie('admin_refresh_token', { ...cookieOpts });
  return res.json({ ok: true });
});

export default router;


