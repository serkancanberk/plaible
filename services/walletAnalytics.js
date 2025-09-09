// services/walletAnalytics.js
import { User } from "../models/User.js";
import { logInfo } from "./logging.js";

/**
 * Get total credits across all users
 * @returns {Promise<number>} Total credits in the system
 */
export async function getTotalCredits() {
  try {
    const result = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$wallet.balance" }
        }
      }
    ]);

    const total = result.length > 0 ? result[0].total : 0;
    
    if (import.meta.env?.DEV) {
      logInfo("Wallet analytics: getTotalCredits", { total });
    }
    
    return total;
  } catch (error) {
    console.error("Error getting total credits:", error);
    return 0;
  }
}

/**
 * Get users with the highest wallet balances
 * @param {number} limit - Number of users to return (default: 1)
 * @returns {Promise<Array>} Array of users with highest balances
 */
export async function getTopCreditUsers(limit = 1) {
  try {
    const users = await User.find({})
      .select('_id email identity.displayName displayName fullName wallet.balance roles status createdAt')
      .sort({ "wallet.balance": -1 })
      .limit(limit)
      .lean();

    const formattedUsers = users.map(user => ({
      _id: user._id,
      email: user.email,
      displayName: user.identity?.displayName || user.displayName || user.fullName || 'Unknown',
      balance: user.wallet?.balance || 0,
      roles: user.roles,
      status: user.status,
      createdAt: user.createdAt
    }));

    if (import.meta.env?.DEV) {
      logInfo("Wallet analytics: getTopCreditUsers", { limit, count: formattedUsers.length });
    }

    return formattedUsers;
  } catch (error) {
    console.error("Error getting top credit users:", error);
    return [];
  }
}

/**
 * Get average wallet balance across all users
 * @returns {Promise<number>} Average balance rounded to 2 decimal places
 */
export async function getAverageBalance() {
  try {
    const result = await User.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: "$wallet.balance" },
          count: { $sum: 1 }
        }
      }
    ]);

    const average = result.length > 0 ? Math.round((result[0].average + Number.EPSILON) * 100) / 100 : 0;
    const userCount = result.length > 0 ? result[0].count : 0;

    if (import.meta.env?.DEV) {
      logInfo("Wallet analytics: getAverageBalance", { average, userCount });
    }

    return { average, userCount };
  } catch (error) {
    console.error("Error getting average balance:", error);
    return { average: 0, userCount: 0 };
  }
}

/**
 * Get wallet balance distribution statistics
 * @returns {Promise<Object>} Distribution statistics
 */
export async function getWalletDistribution() {
  try {
    const result = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$wallet.balance" },
          average: { $avg: "$wallet.balance" },
          min: { $min: "$wallet.balance" },
          max: { $max: "$wallet.balance" },
          count: { $sum: 1 },
          zeroBalance: {
            $sum: {
              $cond: [{ $eq: ["$wallet.balance", 0] }, 1, 0]
            }
          },
          highBalance: {
            $sum: {
              $cond: [{ $gte: ["$wallet.balance", 1000] }, 1, 0]
            }
          }
        }
      }
    ]);

    const stats = result.length > 0 ? result[0] : {
      total: 0,
      average: 0,
      min: 0,
      max: 0,
      count: 0,
      zeroBalance: 0,
      highBalance: 0
    };

    // Calculate percentages
    const zeroBalancePercent = stats.count > 0 ? Math.round((stats.zeroBalance / stats.count) * 100) : 0;
    const highBalancePercent = stats.count > 0 ? Math.round((stats.highBalance / stats.count) * 100) : 0;

    const distribution = {
      total: stats.total,
      average: Math.round((stats.average + Number.EPSILON) * 100) / 100,
      min: stats.min,
      max: stats.max,
      userCount: stats.count,
      zeroBalance: {
        count: stats.zeroBalance,
        percentage: zeroBalancePercent
      },
      highBalance: {
        count: stats.highBalance,
        percentage: highBalancePercent
      }
    };

    if (import.meta.env?.DEV) {
      logInfo("Wallet analytics: getWalletDistribution", distribution);
    }

    return distribution;
  } catch (error) {
    console.error("Error getting wallet distribution:", error);
    return {
      total: 0,
      average: 0,
      min: 0,
      max: 0,
      userCount: 0,
      zeroBalance: { count: 0, percentage: 0 },
      highBalance: { count: 0, percentage: 0 }
    };
  }
}

/**
 * Get wallet analytics summary for admin dashboard
 * @returns {Promise<Object>} Complete wallet analytics summary
 */
export async function getWalletAnalyticsSummary() {
  try {
    // Get total credits across all users
    const totalCreditsResult = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$wallet.balance" }}}
    ]);
    const totalCredits = totalCreditsResult.length > 0 ? totalCreditsResult[0].total : 0;

    // Get total user count
    const totalUsers = await User.countDocuments();
    const averageBalance = totalUsers > 0 ? totalCredits / totalUsers : 0;

    // Count users with zero balance
    const zeroBalanceCount = await User.countDocuments({ "wallet.balance": 0 });

    // Count users with high balance (100+ credits)
    const highBalanceCount = await User.countDocuments({ "wallet.balance": { $gte: 100 }});

    // Get top users
    const topUsers = await getTopCreditUsers(5);

    const summary = {
      totalCredits,
      averageBalance: Number(averageBalance.toFixed(1)),
      zeroBalanceUsers: zeroBalanceCount,
      highBalanceUsers: highBalanceCount,
      topUsers,
      totalUsers,
      timestamp: new Date().toISOString()
    };

    if (import.meta.env?.DEV) {
      console.log("🔍 Wallet Analytics Summary:", {
        totalCredits,
        averageBalance: summary.averageBalance,
        zeroBalanceUsers: zeroBalanceCount,
        highBalanceUsers: highBalanceCount,
        totalUsers,
        topUsersCount: topUsers.length
      });
      logInfo("Wallet analytics: getWalletAnalyticsSummary", summary);
    }

    return summary;
  } catch (error) {
    console.error("Error getting wallet analytics summary:", error);
    return {
      totalCredits: 0,
      averageBalance: 0,
      zeroBalanceUsers: 0,
      highBalanceUsers: 0,
      topUsers: [],
      totalUsers: 0,
      timestamp: new Date().toISOString()
    };
  }
}
