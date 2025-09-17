#!/usr/bin/env node

// Debug script for Top Users query issue
// Investigates why some zero balance users are missing from the top users table

import mongoose from 'mongoose';
import { User } from '../models/User.js';

async function debugTopUsers() {
  console.log("🔍 Debugging Top Users Query Issue");
  console.log("===================================");
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plaible');
    console.log("✅ Connected to MongoDB");
    
    // Get all users sorted by balance (descending)
    const allUsers = await User.find({})
      .select('_id email identity.displayName displayName fullName wallet.balance')
      .sort({ "wallet.balance": -1 })
      .lean();
    
    console.log(`\nAll users sorted by balance (descending):`);
    allUsers.forEach((user, index) => {
      const balance = user.wallet?.balance || 0;
      const displayName = user.identity?.displayName || user.displayName || user.fullName || 'Unknown';
      console.log(`  ${index + 1}. ${displayName}: ${balance} credits`);
    });
    
    // Get top 10 users (same as the API)
    const top10Users = await User.find({})
      .select('_id email identity.displayName displayName fullName wallet.balance')
      .sort({ "wallet.balance": -1 })
      .limit(10)
      .lean();
    
    console.log(`\nTop 10 users (API limit):`);
    top10Users.forEach((user, index) => {
      const balance = user.wallet?.balance || 0;
      const displayName = user.identity?.displayName || user.displayName || user.fullName || 'Unknown';
      console.log(`  ${index + 1}. ${displayName}: ${balance} credits`);
    });
    
    // Count zero balance users in top 10
    const zeroBalanceInTop10 = top10Users.filter(user => (user.wallet?.balance || 0) === 0);
    console.log(`\nZero balance users in top 10: ${zeroBalanceInTop10.length}`);
    
    // Check if there are zero balance users not in top 10
    const allZeroBalanceUsers = allUsers.filter(user => (user.wallet?.balance || 0) === 0);
    const zeroBalanceNotInTop10 = allZeroBalanceUsers.filter(user => 
      !top10Users.some(topUser => topUser._id.toString() === user._id.toString())
    );
    
    console.log(`Total zero balance users: ${allZeroBalanceUsers.length}`);
    console.log(`Zero balance users not in top 10: ${zeroBalanceNotInTop10.length}`);
    
    if (zeroBalanceNotInTop10.length > 0) {
      console.log("\nZero balance users missing from top 10:");
      zeroBalanceNotInTop10.forEach(user => {
        const displayName = user.identity?.displayName || user.displayName || user.fullName || 'Unknown';
        console.log(`  - ${displayName} (${user.email})`);
      });
    }
    
    // Check if the issue is with the limit
    console.log(`\nTotal users: ${allUsers.length}`);
    console.log(`Top 10 limit: 10`);
    console.log(`Users with positive balance: ${allUsers.filter(user => (user.wallet?.balance || 0) > 0).length}`);
    console.log(`Users with zero balance: ${allZeroBalanceUsers.length}`);
    
    // The issue: if we have more than 10 users with positive balance, 
    // zero balance users won't appear in top 10
    const positiveBalanceUsers = allUsers.filter(user => (user.wallet?.balance || 0) > 0);
    if (positiveBalanceUsers.length >= 10) {
      console.log("\n❌ ISSUE IDENTIFIED:");
      console.log("   - There are 10+ users with positive balance");
      console.log("   - Zero balance users are pushed out of the top 10");
      console.log("   - This is expected behavior for a 'top users' query");
      console.log("\n✅ RECOMMENDATION:");
      console.log("   - This is actually correct behavior");
      console.log("   - 'Top users' should show users with highest balances");
      console.log("   - Zero balance users are correctly excluded from 'top' users");
    }
    
  } catch (error) {
    console.error("❌ Error during debugging:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Run the debug script
debugTopUsers().catch(console.error);
