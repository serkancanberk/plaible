import { User } from "../models/User.js";

/**
 * Admin authorization middleware
 * Must run after authGuard to ensure req.userId is available
 * Checks that user has "admin" role and "active" status
 */
export default async function adminGuard(req, res, next) {
  try {
    if (!req.userId) {
      console.log("Admin guard: No userId found");
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }

    const user = await User.findById(req.userId).lean();
    if (!user) {
      console.log("Admin guard: User not found for userId:", req.userId);
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }

    // Check if user has admin role and is active
    const hasAdminRole = user.roles?.includes("admin");
    const isActive = user.status === "active";
    
    if (!hasAdminRole || !isActive) {
      console.log("Admin guard: Access denied for user:", {
        userId: req.userId,
        email: user.email,
        roles: user.roles,
        status: user.status,
        hasAdminRole,
        isActive
      });
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    console.log("Admin guard: Access granted for user:", {
      userId: req.userId,
      email: user.email,
      roles: user.roles,
      status: user.status
    });

    // Store user info for potential use in routes
    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin guard error:", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
