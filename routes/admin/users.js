import express from "express";
import mongoose from "mongoose";
import { User } from "../../models/User.js";
import { Event } from "../../models/Event.js";
import { logEvent } from "../../services/eventLog.js";

const router = express.Router();

// Helper functions
const ok = (res, data) => res.json({ ok: true, ...data });
const err = (res, code, field = null) => {
  const response = { error: code };
  if (field) response.field = field;
  return res.status(code === "BAD_REQUEST" ? 400 : code === "NOT_FOUND" ? 404 : 500).json(response);
};

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List users with filtering and pagination
 *     description: Retrieve paginated list of users with optional filtering by query, role, and status
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query, name: query, schema: { type: string }, description: Search in email, displayName, googleId
 *       - in: query, name: role, schema: { type: string }, description: Filter by role
 *       - in: query, name: status, schema: { type: string, enum: [active, disabled, deleted] }, description: Filter by status
 *       - in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 }, description: Number of results per page
 *       - in: query, name: offset, schema: { type: integer, minimum: 0, default: 0 }, description: Number of results to skip
 *       - in: query, name: cursor, schema: { type: string, format: date-time }, description: Pagination cursor (ISO date)
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 items: { type: array, items: { type: object } }
 *                 totalCount: { type: integer, example: 42 }
 *                 nextCursor: { type: string, format: date-time, nullable: true }
 *       403: { description: "Forbidden", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "FORBIDDEN" } } } } } }
 */
router.get("/", async (req, res) => {
  try {
    const { query: searchQuery, role, status, limit = 20, cursor, offset = 0 } = req.query;
    const pageSize = Math.min(parseInt(limit) || 20, 100);
    const skip = parseInt(offset) || 0;

    // Build filter
    const filter = {};
    
    if (searchQuery) {
      const regex = new RegExp(searchQuery, 'i');
      filter.$or = [
        { email: regex },
        { 'identity.displayName': regex },
        { displayName: regex },
        { fullName: regex },
        { googleId: regex }
      ];
    }
    
    if (role) filter.roles = role;
    if (status) filter.status = status;
    
    if (cursor) {
      filter.createdAt = { $lt: new Date(cursor) };
    }

    // Get total count for pagination
    const totalCount = await User.countDocuments(filter);

    // Query with offset and limit
    const users = await User.find(filter)
      .select('_id email identity.displayName displayName fullName roles status wallet.balance createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Transform items to match expected format
    const transformedItems = users.map(user => ({
      _id: user._id,
      email: user.email,
      displayName: user.identity?.displayName || user.displayName || user.fullName || 'Unknown',
      roles: user.roles || ['user'],
      status: user.status || 'active',
      balance: (user.wallet && typeof user.wallet.balance === 'number') ? user.wallet.balance : 0,
      createdAt: user.createdAt
    }));

    return ok(res, { items: transformedItems, totalCount });
  } catch (error) {
    console.error("Admin users list error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user details with recent events
 *     description: Retrieve detailed user information including wallet and last 5 events
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: id, required: true, schema: { type: string }, description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 user: { type: object }
 *                 events: { type: array }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" }, field: { type: string, example: "id" } } } } } }
 *       404: { description: "Not Found", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "NOT_FOUND" } } } } } }
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, "BAD_REQUEST", "id");
    }

    const user = await User.findById(id).lean();
    if (!user) {
      return err(res, "NOT_FOUND");
    }

    // Get last 5 events for this user
    const events = await Event.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type meta createdAt')
      .lean();

    return ok(res, { user, events });
  } catch (error) {
    console.error("Admin user details error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new user
 *     description: Create a new user with specified details (for admin import/stub)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, displayName]
 *             properties:
 *               email: { type: string, format: email, example: "user@example.com" }
 *               displayName: { type: string, example: "John Doe" }
 *               roles: { type: array, items: { type: string }, example: ["user"] }
 *               status: { type: string, enum: [active, disabled], example: "active" }
 *               walletBalance: { type: number, minimum: 0, example: 100 }
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 userId: { type: string, example: "68badfecd69761f15d790d09" }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 */
router.post("/", async (req, res) => {
  try {
    const { email, displayName, roles = ["user"], status = "active", walletBalance = 0 } = req.body;

    if (!email || !displayName) {
      return err(res, "BAD_REQUEST");
    }

    // Validate walletBalance
    const balance = Number(walletBalance);
    if (isNaN(balance) || balance < 0) {
      return err(res, "BAD_REQUEST", "walletBalance");
    }

    const user = new User({
      email,
      displayName: displayName.toLowerCase(),
      identity: { displayName },
      fullName: displayName,
      roles,
      status,
      wallet: {
        balance: balance,
        currency: 'CREDITS'
      }
    });

    await user.save();

    // Log the initial wallet balance if it's greater than 0
    if (balance > 0) {
      try {
        const { logWalletTransaction } = await import("../../services/walletTransactionLogger.js");
        await logWalletTransaction(
          user._id,
          "credit",
          balance,
          "admin",
          balance,
          "Initial wallet balance set by admin",
          { adminUserId: req.userId }
        );
      } catch (error) {
        console.error("Failed to log initial wallet transaction:", error);
        // Don't fail the user creation if logging fails
      }
    }

    // Log admin action
    await logEvent({
      type: "admin.users.create",
      userId: req.userId,
      meta: { targetUserId: user._id, email, displayName, roles, status, walletBalance: balance },
      level: "info"
    });

    return ok(res, { userId: user._id });
  } catch (error) {
    console.error("Admin user create error:", error);
    if (error.code === 11000) {
      return err(res, "BAD_REQUEST");
    }
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update user details
 *     description: Update user information including displayName, roles, and status
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: id, required: true, schema: { type: string }, description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName: { type: string, example: "John Doe Updated" }
 *               roles: { type: array, items: { type: string }, example: ["user", "premium"] }
 *               status: { type: string, enum: [active, disabled], example: "active" }
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 *       404: { description: "Not Found", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "NOT_FOUND" } } } } } }
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, roles, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, "BAD_REQUEST", "id");
    }

    const user = await User.findById(id);
    if (!user) {
      return err(res, "NOT_FOUND");
    }

    const originalData = { displayName: user.identity?.displayName, roles: user.roles, status: user.status };
    const changes = {};

    if (displayName !== undefined) {
      user.identity.displayName = displayName;
      user.fullName = displayName;
      user.displayName = displayName.toLowerCase();
      changes.displayName = displayName;
    }

    if (roles !== undefined) {
      user.roles = roles;
      changes.roles = roles;
    }

    if (status !== undefined && ["active", "disabled"].includes(status)) {
      user.status = status;
      changes.status = status;
    }

    await user.save();

    // Log admin action with diff
    await logEvent({
      type: "admin.users.update",
      userId: req.userId,
      meta: { targetUserId: id, changes, original: originalData },
      level: "info"
    });

    return ok(res);
  } catch (error) {
    console.error("Admin user update error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user status
 *     description: Change user status to active or disabled
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: id, required: true, schema: { type: string }, description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, disabled], example: "disabled" }
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 *       404: { description: "Not Found", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "NOT_FOUND" } } } } } }
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, "BAD_REQUEST", "id");
    }

    if (!["active", "disabled"].includes(status)) {
      return err(res, "BAD_REQUEST", "status");
    }

    const user = await User.findById(id);
    if (!user) {
      return err(res, "NOT_FOUND");
    }

    // Prevent admin users from disabling themselves
    if (user._id.toString() === req.userId && status === 'disabled') {
      return err(res, "BAD_REQUEST", "Cannot disable your own admin account");
    }

    const oldStatus = user.status;
    user.status = status;
    user.updatedAt = new Date();
    
    // Ensure wallet structure is valid before saving
    if (!user.wallet || typeof user.wallet.balance !== 'number') {
      user.wallet = { balance: 0, currency: 'CREDITS' };
    }
    
    await user.save();

    // Log admin action
    await logEvent({
      type: "admin.users.status",
      userId: req.userId,
      meta: { targetUserId: id, oldStatus, newStatus: status },
      level: "info"
    });

    return ok(res);
  } catch (error) {
    console.error("Admin user status update error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Soft delete user
 *     description: Mark user as deleted (soft delete)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: id, required: true, schema: { type: string }, description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *       400: { description: "Bad Request", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "BAD_REQUEST" } } } } } }
 *       404: { description: "Not Found", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "NOT_FOUND" } } } } } }
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, "BAD_REQUEST", "id");
    }

    const user = await User.findById(id);
    if (!user) {
      return err(res, "NOT_FOUND");
    }

    user.status = "deleted";
    user.deletedAt = new Date();
    await user.save();

    // Log admin action
    await logEvent({
      type: "admin.users.delete",
      userId: req.userId,
      meta: { targetUserId: id, email: user.email, displayName: user.identity?.displayName },
      level: "info"
    });

    return ok(res);
  } catch (error) {
    console.error("Admin user delete error:", error);
    return err(res, "SERVER_ERROR");
  }
});

export default router;
