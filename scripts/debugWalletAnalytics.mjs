#!/usr/bin/env node

// Debug script for Wallet Analytics issues
// Investigates zero balance users count, transaction data, and chart issues

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { getWalletAnalyticsSummary, getTopCreditUsers, getWalletDistribution } from '../services/walletAnalytics.js';
import { getWalletTransactionStats } from '../services/walletTransactionLogger.js';

async function debugWalletAnalytics() {
  console.log("🔍 Debugging Wallet Analytics Issues");
  console.log("=====================================");
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plaible');
    console.log("✅ Connected to MongoDB");
    
    // 1. Investigate Zero Balance Users Count Issue
    console.log("\n📊 1. Zero Balance Users Investigation:");
    console.log("----------------------------------------");
    
    // Get all users with their wallet balances
    const allUsers = await User.find({})
      .select('_id email identity.displayName displayName fullName wallet.balance')
      .lean();
    
    console.log(`Total users in database: ${allUsers.length}`);
    
    // Count users with exactly 0 balance
    const zeroBalanceUsers = allUsers.filter(user => (user.wallet?.balance || 0) === 0);
    console.log(`Users with exactly 0 balance: ${zeroBalanceUsers.length}`);
    
    // Count users with balance < 0 (should be 0)
    const negativeBalanceUsers = allUsers.filter(user => (user.wallet?.balance || 0) < 0);
    console.log(`Users with negative balance: ${negativeBalanceUsers.length}`);
    
    // Count users with balance <= 0 (this might be the issue)
    const zeroOrNegativeUsers = allUsers.filter(user => (user.wallet?.balance || 0) <= 0);
    console.log(`Users with balance <= 0: ${zeroOrNegativeUsers.length}`);
    
    // Show individual user balances
    console.log("\nIndividual user balances:");
    allUsers.forEach(user => {
      const balance = user.wallet?.balance || 0;
      const displayName = user.identity?.displayName || user.displayName || user.fullName || 'Unknown';
      console.log(`  - ${displayName} (${user.email}): ${balance} credits`);
    });
    
    // Test the analytics service
    console.log("\n📈 Analytics Service Results:");
    const analyticsSummary = await getWalletAnalyticsSummary();
    console.log("Analytics Summary:", {
      totalCredits: analyticsSummary.totalCredits,
      averageBalance: analyticsSummary.averageBalance,
      zeroBalanceUsers: analyticsSummary.zeroBalanceUsers,
      highBalanceUsers: analyticsSummary.highBalanceUsers,
      totalUsers: analyticsSummary.totalUsers
    });
    
    // Test the distribution service
    const distribution = await getWalletDistribution();
    console.log("Distribution:", {
      userCount: distribution.userCount,
      zeroBalance: distribution.zeroBalance,
      highBalance: distribution.highBalance
    });
    
    // 2. Investigate Transaction Data
    console.log("\n📊 2. Transaction Data Investigation:");
    console.log("-------------------------------------");
    
    const totalTransactions = await WalletTransaction.countDocuments();
    console.log(`Total transactions in database: ${totalTransactions}`);
    
    if (totalTransactions > 0) {
      // Get transaction summary
      const transactionStats = await getWalletTransactionStats();
      console.log("Transaction Stats:", transactionStats);
      
      // Get sample transactions
      const sampleTransactions = await WalletTransaction.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      
      console.log("\nSample transactions:");
      sampleTransactions.forEach(tx => {
        console.log(`  - ${tx.type}: ${tx.amount} credits (${tx.source}) - ${tx.createdAt}`);
      });
      
      // Check for credit vs debit transactions
      const creditCount = await WalletTransaction.countDocuments({ type: 'credit' });
      const debitCount = await WalletTransaction.countDocuments({ type: 'debit' });
      console.log(`\nCredit transactions: ${creditCount}`);
      console.log(`Debit transactions: ${debitCount}`);
      
    } else {
      console.log("❌ No transactions found in database");
    }
    
    // 3. Test Top Users Query
    console.log("\n📊 3. Top Users Investigation:");
    console.log("------------------------------");
    
    const topUsers = await getTopCreditUsers(10);
    console.log(`Top users returned: ${topUsers.length}`);
    
    topUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.displayName}: ${user.balance} credits`);
    });
    
    // 4. Check for Data Inconsistencies
    console.log("\n📊 4. Data Consistency Check:");
    console.log("-----------------------------");
    
    // Check if zero balance count matches the table
    const zeroBalanceInTopUsers = topUsers.filter(user => user.balance === 0);
    console.log(`Zero balance users in top users table: ${zeroBalanceInTopUsers.length}`);
    
    // Check if analytics zero balance count matches actual count
    const actualZeroBalance = allUsers.filter(user => (user.wallet?.balance || 0) === 0).length;
    const analyticsZeroBalance = analyticsSummary.zeroBalanceUsers;
    
    console.log(`Actual zero balance users: ${actualZeroBalance}`);
    console.log(`Analytics zero balance users: ${analyticsZeroBalance}`);
    
    if (actualZeroBalance !== analyticsZeroBalance) {
      console.log("❌ MISMATCH: Zero balance count doesn't match!");
    } else {
      console.log("✅ Zero balance count matches");
    }
    
    // 5. Check for Mock/Test Data
    console.log("\n📊 5. Mock/Test Data Check:");
    console.log("---------------------------");
    
    // Check if there are any transactions that look like test data
    const testTransactions = await WalletTransaction.find({
      $or: [
        { note: { $regex: /test|mock|sample/i } },
        { source: { $regex: /test|mock|sample/i } }
      ]
    });
    
    console.log(`Test/mock transactions found: ${testTransactions.length}`);
    
    if (testTransactions.length > 0) {
      console.log("Sample test transactions:");
      testTransactions.forEach(tx => {
        console.log(`  - ${tx.type}: ${tx.amount} credits (${tx.source}) - ${tx.note}`);
      });
    }
    
    // 6. Summary and Recommendations
    console.log("\n📋 Summary and Recommendations:");
    console.log("===============================");
    
    console.log("Issues Found:");
    
    if (actualZeroBalance !== analyticsZeroBalance) {
      console.log("❌ Zero balance users count mismatch");
      console.log("   - Check the query in getWalletAnalyticsSummary()");
      console.log("   - Verify the countDocuments query uses correct filter");
    }
    
    if (totalTransactions === 0) {
      console.log("❌ No transaction data found");
      console.log("   - Chart showing credits spent is using mock data");
      console.log("   - Transaction summary is showing 0 values");
    } else {
      console.log("✅ Transaction data exists");
    }
    
    if (zeroBalanceInTopUsers.length !== actualZeroBalance) {
      console.log("❌ Top users table doesn't show all zero balance users");
      console.log("   - Top users query might be filtering out zero balance users");
    }
    
    console.log("\nRecommended Fixes:");
    console.log("1. Fix zero balance count query in getWalletAnalyticsSummary()");
    console.log("2. Replace mock chart data with real transaction data");
    console.log("3. Fix chart overflow issue in SimpleChart component");
    console.log("4. Ensure top users query includes all users (including zero balance)");
    
  } catch (error) {
    console.error("❌ Error during debugging:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Run the debug script
debugWalletAnalytics().catch(console.error);
