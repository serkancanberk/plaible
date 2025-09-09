// routes/admin/walletAnalytics.js
import express from "express";
import { getWalletAnalyticsSummary, getTotalCredits, getTopCreditUsers, getAverageBalance, getWalletDistribution } from "../../services/walletAnalytics.js";
import { getWalletTransactionStats, getDailyWalletSummary, getUserWalletHistory } from "../../services/walletTransactionLogger.js";
import { WalletTransaction } from "../../models/WalletTransaction.js";

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
 * /api/admin/wallet/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Get comprehensive wallet analytics
 *     description: Retrieve complete wallet analytics including totals, top users, and distribution
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wallet analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 analytics: { type: object }
 *       403: { description: "Forbidden", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "FORBIDDEN" } } } } } }
 */
router.get("/analytics", async (req, res) => {
  try {
    const analytics = await getWalletAnalyticsSummary();
    return ok(res, { analytics });
  } catch (error) {
    console.error("Admin wallet analytics error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/wallet/total:
 *   get:
 *     tags: [Admin]
 *     summary: Get total credits in system
 *     description: Get the total amount of credits across all users
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Total credits retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 totalCredits: { type: number, example: 15000 }
 *       403: { description: "Forbidden", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "FORBIDDEN" } } } } } }
 */
router.get("/total", async (req, res) => {
  try {
    const totalCredits = await getTotalCredits();
    return ok(res, { totalCredits });
  } catch (error) {
    console.error("Admin wallet total error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/wallet/top-users:
 *   get:
 *     tags: [Admin]
 *     summary: Get top users by wallet balance
 *     description: Get users with the highest wallet balances
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 10 }, description: Number of top users to return
 *     responses:
 *       200:
 *         description: Top users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 users: { type: array, items: { type: object } }
 *       403: { description: "Forbidden", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "FORBIDDEN" } } } } } }
 */
router.get("/top-users", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 10, 100);
    
    const users = await getTopCreditUsers(limitNum);
    return ok(res, { users });
  } catch (error) {
    console.error("Admin wallet top users error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/wallet/distribution:
 *   get:
 *     tags: [Admin]
 *     summary: Get wallet balance distribution
 *     description: Get statistics about wallet balance distribution across users
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Distribution statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 distribution: { type: object }
 *       403: { description: "Forbidden", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "FORBIDDEN" } } } } } }
 */
router.get("/distribution", async (req, res) => {
  try {
    const distribution = await getWalletDistribution();
    return ok(res, { distribution });
  } catch (error) {
    console.error("Admin wallet distribution error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/wallet/transactions/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get wallet transaction statistics
 *     description: Get statistics about wallet transactions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query, name: startDate, schema: { type: string, format: date }, description: Start date for filtering (YYYY-MM-DD)
 *       - in: query, name: endDate, schema: { type: string, format: date }, description: End date for filtering (YYYY-MM-DD)
 *       - in: query, name: type, schema: { type: string, enum: [credit, debit] }, description: Filter by transaction type
 *       - in: query, name: source, schema: { type: string, enum: [admin, purchase, ai, topup, play, refund, adjustment] }, description: Filter by transaction source
 *     responses:
 *       200:
 *         description: Transaction statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 stats: { type: object }
 *       403: { description: "Forbidden", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "FORBIDDEN" } } } } } }
 */
router.get("/transactions/stats", async (req, res) => {
  try {
    const { startDate, endDate, type, source } = req.query;
    
    // Build filter for WalletTransaction aggregation
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (type) filter.type = type;
    if (source) filter.source = source;

    // Aggregate real transaction data
    const stats = await WalletTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const added = stats.find(s => s._id === "credit") || { totalAmount: 0, count: 0 };
    const spent = stats.find(s => s._id === "debit") || { totalAmount: 0, count: 0 };

    const result = {
      totalTransactions: added.count + spent.count,
      creditsAdded: added.totalAmount,
      creditsSpent: spent.totalAmount,
      netCredits: added.totalAmount - spent.totalAmount,
      averageAmount: (added.count + spent.count) > 0 ? 
        (added.totalAmount + spent.totalAmount) / (added.count + spent.count) : 0,
      uniqueUserCount: 0 // We'll calculate this separately if needed
    };

    // Get unique user count if we have transactions
    if (result.totalTransactions > 0) {
      const userCountResult = await WalletTransaction.aggregate([
        { $match: filter },
        { $group: { _id: "$userId" } },
        { $count: "uniqueUsers" }
      ]);
      result.uniqueUserCount = userCountResult.length > 0 ? userCountResult[0].uniqueUsers : 0;
    }

    if (import.meta.env?.DEV) {
      console.log("🔍 Transaction Stats:", {
        filter,
        stats,
        result
      });
    }

    return ok(res, { stats: result });
  } catch (error) {
    console.error("Admin wallet transaction stats error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/wallet/transactions/daily:
 *   get:
 *     tags: [Admin]
 *     summary: Get daily wallet transaction summary
 *     description: Get summary of wallet transactions for a specific day
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query, name: date, schema: { type: string, format: date }, description: Date for summary (YYYY-MM-DD, defaults to today)
 *     responses:
 *       200:
 *         description: Daily summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 summary: { type: object }
 *       403: { description: "Forbidden", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "FORBIDDEN" } } } } } }
 */
router.get("/transactions/daily", async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Aggregate daily transaction data
    const dailyStats = await WalletTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const added = dailyStats.find(s => s._id === "credit") || { totalAmount: 0, count: 0 };
    const spent = dailyStats.find(s => s._id === "debit") || { totalAmount: 0, count: 0 };

    const stats = {
      totalTransactions: added.count + spent.count,
      creditsAdded: added.totalAmount,
      creditsSpent: spent.totalAmount,
      netCredits: added.totalAmount - spent.totalAmount,
      averageAmount: (added.count + spent.count) > 0 ? 
        (added.totalAmount + spent.totalAmount) / (added.count + spent.count) : 0,
      uniqueUserCount: 0
    };

    // Get unique user count for the day
    if (stats.totalTransactions > 0) {
      const userCountResult = await WalletTransaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        { $group: { _id: "$userId" } },
        { $count: "uniqueUsers" }
      ]);
      stats.uniqueUserCount = userCountResult.length > 0 ? userCountResult[0].uniqueUsers : 0;
    }

    // Get top transactions for the day
    const topTransactions = await WalletTransaction.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
    .sort({ amount: -1 })
    .limit(10)
    .populate('userId', 'email identity.displayName')
    .lean();

    const summary = {
      date: startOfDay.toISOString().split('T')[0],
      stats,
      topTransactions: topTransactions.map(tx => ({
        _id: tx._id,
        userId: tx.userId,
        type: tx.type,
        amount: tx.amount,
        source: tx.source,
        note: tx.note,
        createdAt: tx.createdAt
      }))
    };

    if (import.meta.env?.DEV) {
      console.log("🔍 Daily Summary:", {
        date: summary.date,
        stats,
        topTransactionsCount: topTransactions.length
      });
    }

    return ok(res, { summary });
  } catch (error) {
    console.error("Admin wallet daily summary error:", error);
    return err(res, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/admin/wallet/transactions/user/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user's wallet transaction history
 *     description: Get transaction history for a specific user
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path, name: userId, required: true, schema: { type: string }, description: User ID
 *       - in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 50 }, description: Number of transactions to return
 *       - in: query, name: offset, schema: { type: integer, minimum: 0, default: 0 }, description: Number of transactions to skip
 *       - in: query, name: type, schema: { type: string, enum: [credit, debit] }, description: Filter by transaction type
 *       - in: query, name: source, schema: { type: string, enum: [admin, purchase, ai, topup, play, refund, adjustment] }, description: Filter by transaction source
 *     responses:
 *       200:
 *         description: User transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 transactions: { type: array, items: { type: object } }
 *       403: { description: "Forbidden", content: { application/json: { schema: { type: object, properties: { error: { type: string, example: "FORBIDDEN" } } } } } }
 */
router.get("/transactions/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, type, source } = req.query;
    
    const options = {
      limit: Math.min(parseInt(limit) || 50, 100),
      offset: Math.max(parseInt(offset) || 0, 0)
    };
    
    if (type) options.type = type;
    if (source) options.source = source;
    
    const transactions = await getUserWalletHistory(userId, options);
    return ok(res, { transactions });
  } catch (error) {
    console.error("Admin wallet user history error:", error);
    return err(res, "SERVER_ERROR");
  }
});

export default router;
