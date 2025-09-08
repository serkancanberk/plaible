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
 *                 nextCursor: { type: string, format: date-time, nullable: true }
 *       403: { description: "Forbidden", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "FORBIDDEN" } } } } } }
 */
router.get("/", async (req, res) => {
  try {
    const { query: searchQuery, role, status, limit = 20, cursor } = req.query;
    const pageSize = Math.min(parseInt(limit) || 20, 100);

    // Build filter
    const filter = {};
    
    if (searchQuery) {
      const regex = new RegExp(searchQuery, 'i');
      filter.$or = [
        { email: regex },
        { 'identity.displayName': regex },
        { googleId: regex }
      ];
    }
    
    if (role) filter.roles = role;
    if (status) filter.status = status;
    
    if (cursor) {
      filter.createdAt = { $lt: new Date(cursor) };
    }

    // Query with limit + 1 to check for more results
    const users = await User.find(filter)
      .select('_id email identity.displayName roles status wallet.balance createdAt')
      .sort({ createdAt: -1 })
      .limit(pageSize + 1)
      .lean();

    const hasMore = users.length > pageSize;
    const items = hasMore ? users.slice(0, pageSize) : users;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    // Transform items to match expected format
    const transformedItems = items.map(user => ({
      _id: user._id,
      email: user.email,
      displayName: user.identity?.displayName || user.displayName,
      roles: user.roles,
      status: user.status,
      balance: user.wallet?.balance || 0,
      createdAt: user.createdAt
    }));

    return ok(res, { items: transformedItems, nextCursor });
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
    const { email, displayName, roles = ["user"] } = req.body;

    if (!email || !displayName) {
      return err(res, "BAD_REQUEST");
    }

    const user = new User({
      email,
      displayName: displayName.toLowerCase(),
      identity: { displayName },
      fullName: displayName,
      roles,
      status: "active"
    });

    await user.save();

    // Log admin action
    await logEvent({
      type: "admin.users.create",
      userId: req.userId,
      meta: { targetUserId: user._id, email, displayName, roles },
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

    const oldStatus = user.status;
    user.status = status;
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
