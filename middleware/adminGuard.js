import { User } from "../models/User.js";

/**
 * Admin authorization middleware
 * Must run after authGuard to ensure req.userId is available
 * Checks that user has "admin" role and "active" status
 */
export default async function adminGuard(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }

    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }

    // Check if user has admin role and is active
    if (!user.roles?.includes("admin") || user.status !== "active") {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    // Store user info for potential use in routes
    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin guard error:", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
