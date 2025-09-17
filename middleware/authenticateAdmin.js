import { verifyJwt, signJwt } from "../auth/config.js";
import { RefreshToken } from "../models/RefreshToken.js";

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";
const FORCE_SECURE_COOKIE = String(process.env.FORCE_SECURE_COOKIE || "").toLowerCase() === "true";

/**
 * Admin authentication middleware
 * Verifies the admin_token cookie and confirms email matches ADMIN_EMAIL
 * Automatically refreshes tokens when access token is expired
 * Must be used for all /api/admin/* routes
 */
export default async function authenticateAdmin(req, res, next) {
  try {
    const adminToken = req.cookies?.admin_token;
    const refreshToken = req.cookies?.admin_refresh_token;
    
    if (!adminToken) {
      console.log("Admin auth: No admin_token cookie found");
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }
    
    let decoded;
    let tokenValid = true;
    
    try {
      decoded = verifyJwt(adminToken);
    } catch (error) {
      // Token is expired or invalid
      tokenValid = false;
      console.log("Admin auth: Access token expired or invalid, attempting refresh");
    }
    
    // If access token is invalid/expired, try to refresh it
    if (!tokenValid && refreshToken) {
      try {
        const tokenDoc = await RefreshToken.findAndValidate(refreshToken);
        
        if (!tokenDoc) {
          console.log("Admin auth: Invalid refresh token");
          return res.status(401).json({ error: "INVALID_REFRESH_TOKEN" });
        }
        
        // Verify the user is still the admin
        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
        if (tokenDoc.userEmail?.toLowerCase() !== adminEmail) {
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
        
        // Update decoded with new token info
        decoded = {
          sub: tokenDoc.userId._id.toString(),
          email: tokenDoc.userEmail,
          name: tokenDoc.userId.identity?.displayName || tokenDoc.userId.fullName,
          role: 'admin'
        };
        
        console.log("Admin auth: Token refreshed for", tokenDoc.userEmail);
      } catch (error) {
        console.error("Admin auth: Token refresh failed:", error);
        return res.status(401).json({ error: "REFRESH_FAILED" });
      }
    } else if (!tokenValid) {
      console.log("Admin auth: No refresh token available");
      return res.status(401).json({ error: "TOKEN_EXPIRED" });
    }
    
    if (!decoded) {
      console.log("Admin auth: Invalid admin token");
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }
    
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const tokenEmail = decoded.email?.toLowerCase();
    
    if (!adminEmail || !tokenEmail || tokenEmail !== adminEmail) {
      console.log("Admin auth: Email mismatch", { 
        expected: adminEmail, 
        received: tokenEmail 
      });
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    
    // Store admin user info for use in routes
    req.adminUser = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
    
    console.log("Admin auth: Access granted for", decoded.email);
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
