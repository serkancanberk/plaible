// services/walletTransactionLogger.js
import { WalletTransaction } from "../models/WalletTransaction.js";
import { User } from "../models/User.js";
import { logInfo, logError } from "./logging.js";

/**
 * Log a wallet transaction to the walletTransactions collection
 * @param {string} userId - User ID
 * @param {string} type - Transaction type: "credit" | "debit"
 * @param {number} amount - Transaction amount
 * @param {string} source - Transaction source: "admin" | "purchase" | "ai" | "topup" | "play" | "refund" | "adjustment"
 * @param {number} balanceAfter - Wallet balance after transaction
 * @param {string} note - Optional note
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<Object>} Created transaction document
 */
export async function logWalletTransaction(userId, type, amount, source, balanceAfter, note = null, metadata = {}) {
  try {
    // Validate inputs
    if (!userId || !type || !amount || !source || balanceAfter === undefined) {
      throw new Error("Missing required parameters for wallet transaction logging");
    }

    if (!["credit", "debit"].includes(type)) {
      throw new Error(`Invalid transaction type: ${type}`);
    }

    if (!["admin", "purchase", "ai", "topup", "play", "refund", "adjustment"].includes(source)) {
      throw new Error(`Invalid transaction source: ${source}`);
    }

    if (amount < 0) {
      throw new Error("Transaction amount cannot be negative");
    }

    if (balanceAfter < 0) {
      throw new Error("Balance after transaction cannot be negative");
    }

    // Create transaction record
    const transaction = new WalletTransaction({
      userId,
      type,
      source,
      amount,
      balanceAfter,
      note,
      metadata
    });

    await transaction.save();

    if (import.meta.env?.DEV) {
      logInfo("Wallet transaction logged", {
        transactionId: transaction._id,
        userId,
        type,
        amount,
        source,
        balanceAfter,
        note
      });
    }

    return transaction;
  } catch (error) {
    logError("Failed to log wallet transaction", {
      userId,
      type,
      amount,
      source,
      balanceAfter,
      note,
      error: error.message
    });
    
    // Don't throw - logging should not break the main flow
    console.error("Wallet transaction logging failed:", error);
    return null;
  }
}

/**
 * Centralized function to update user wallet balance and log transaction
 * @param {string} userId - User ID
 * @param {string} type - Transaction type: "credit" | "debit"
 * @param {number} amount - Transaction amount
 * @param {string} source - Transaction source
 * @param {string} note - Optional note
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<Object>} Updated user and transaction record
 */
export async function updateWalletBalance(userId, type, amount, source, note = null, metadata = {}) {
  try {
    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Calculate new balance
    const currentBalance = user.wallet?.balance || 0;
    const delta = type === "credit" ? amount : -amount;
    const newBalance = currentBalance + delta;

    if (newBalance < 0) {
      throw new Error("Insufficient balance for transaction");
    }

    // Update user wallet balance
    user.wallet.balance = newBalance;
    await user.save();

    // Log the transaction
    const transaction = await logWalletTransaction(
      userId,
      type,
      amount,
      source,
      newBalance,
      note,
      metadata
    );

    if (import.meta.env?.DEV) {
      logInfo("Wallet balance updated", {
        userId,
        type,
        amount,
        previousBalance: currentBalance,
        newBalance,
        source,
        transactionId: transaction?._id
      });
    }

    return {
      user,
      transaction,
      previousBalance: currentBalance,
      newBalance
    };
  } catch (error) {
    logError("Failed to update wallet balance", {
      userId,
      type,
      amount,
      source,
      error: error.message
    });
    throw error;
  }
}

/**
 * Get user's wallet transaction history
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Transaction history
 */
export async function getUserWalletHistory(userId, options = {}) {
  try {
    const {
      limit = 50,
      offset = 0,
      type,
      source,
      startDate,
      endDate
    } = options;

    const transactions = await WalletTransaction.getUserHistory(userId, {
      limit,
      offset,
      type,
      source,
      startDate,
      endDate
    });

    if (import.meta.env?.DEV) {
      logInfo("Retrieved wallet history", {
        userId,
        transactionCount: transactions.length,
        options
      });
    }

    return transactions;
  } catch (error) {
    logError("Failed to get wallet history", {
      userId,
      options,
      error: error.message
    });
    return [];
  }
}

/**
 * Get wallet transaction statistics
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Transaction statistics
 */
export async function getWalletTransactionStats(options = {}) {
  try {
    const stats = await WalletTransaction.getTransactionStats(options);

    if (import.meta.env?.DEV) {
      logInfo("Retrieved wallet transaction stats", {
        stats,
        options
      });
    }

    return stats;
  } catch (error) {
    logError("Failed to get wallet transaction stats", {
      options,
      error: error.message
    });
    return {
      totalTransactions: 0,
      totalCredits: 0,
      totalDebits: 0,
      netCredits: 0,
      averageAmount: 0,
      uniqueUserCount: 0
    };
  }
}

/**
 * Get daily wallet transaction summary for analytics
 * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to today)
 * @returns {Promise<Object>} Daily transaction summary
 */
export async function getDailyWalletSummary(date = null) {
  try {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const [stats, topTransactions] = await Promise.all([
      WalletTransaction.getTransactionStats({
        startDate: startOfDay,
        endDate: endOfDay
      }),
      WalletTransaction.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      })
      .sort({ amount: -1 })
      .limit(10)
      .populate('userId', 'email identity.displayName')
      .lean()
    ]);

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
      logInfo("Retrieved daily wallet summary", {
        date: summary.date,
        totalTransactions: stats.totalTransactions,
        netCredits: stats.netCredits
      });
    }

    return summary;
  } catch (error) {
    logError("Failed to get daily wallet summary", {
      date,
      error: error.message
    });
    return {
      date: date || new Date().toISOString().split('T')[0],
      stats: {
        totalTransactions: 0,
        totalCredits: 0,
        totalDebits: 0,
        netCredits: 0,
        averageAmount: 0,
        uniqueUserCount: 0
      },
      topTransactions: []
    };
  }
}
