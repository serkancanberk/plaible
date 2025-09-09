// scripts/migrate-wallet-balance.mjs
// Migration script to consolidate walletBalance to wallet.balance
import mongoose from 'mongoose';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/plaible');

// Import the User model
const { User } = await import('../models/User.js');

console.log('🔄 Starting wallet balance migration...');

try {
  // Step 1: Find all users with walletBalance field
  console.log('\n📊 Analyzing current data...');
  const usersWithWalletBalance = await User.find({ walletBalance: { $exists: true } }).lean();
  console.log(`Found ${usersWithWalletBalance.length} users with walletBalance field`);

  // Step 2: Analyze the data structure
  let usersWithBothFields = 0;
  let usersWithOnlyWalletBalance = 0;
  let usersWithOnlyWalletBalanceField = 0;

  for (const user of usersWithWalletBalance) {
    const hasWalletBalance = user.walletBalance !== undefined;
    const hasWalletBalanceField = user.wallet?.balance !== undefined;
    
    if (hasWalletBalance && hasWalletBalanceField) {
      usersWithBothFields++;
    } else if (hasWalletBalance && !hasWalletBalanceField) {
      usersWithOnlyWalletBalance++;
    } else if (!hasWalletBalance && hasWalletBalanceField) {
      usersWithOnlyWalletBalanceField++;
    }
  }

  console.log(`- Users with both fields: ${usersWithBothFields}`);
  console.log(`- Users with only walletBalance: ${usersWithOnlyWalletBalance}`);
  console.log(`- Users with only wallet.balance: ${usersWithOnlyWalletBalanceField}`);

  // Step 3: Perform the migration
  console.log('\n🔄 Starting migration...');

  // Case 1: Users with walletBalance but no wallet.balance - migrate the value
  const migrateResult1 = await User.updateMany(
    { 
      walletBalance: { $exists: true },
      'wallet.balance': { $exists: false }
    },
    [
      {
        $set: {
          'wallet.balance': '$walletBalance',
          'wallet.currency': 'CREDITS'
        }
      }
    ]
  );
  console.log(`✅ Migrated ${migrateResult1.modifiedCount} users (walletBalance → wallet.balance)`);

  // Case 2: Users with both fields - ensure wallet.balance is set and remove walletBalance
  const migrateResult2 = await User.updateMany(
    { 
      walletBalance: { $exists: true },
      'wallet.balance': { $exists: true }
    },
    [
      {
        $set: {
          'wallet.balance': { $ifNull: ['$wallet.balance', '$walletBalance'] },
          'wallet.currency': 'CREDITS'
        }
      }
    ]
  );
  console.log(`✅ Updated ${migrateResult2.modifiedCount} users (ensured wallet.balance is set)`);

  // Step 4: Remove walletBalance field from all documents
  console.log('\n🗑️ Removing walletBalance field...');
  const removeResult = await User.updateMany(
    { walletBalance: { $exists: true } },
    { $unset: { walletBalance: 1 } }
  );
  console.log(`✅ Removed walletBalance field from ${removeResult.modifiedCount} users`);

  // Step 5: Verify the migration
  console.log('\n🔍 Verifying migration...');
  const remainingWalletBalance = await User.countDocuments({ walletBalance: { $exists: true } });
  const usersWithWalletBalanceField = await User.countDocuments({ 'wallet.balance': { $exists: true } });
  
  console.log(`- Users still with walletBalance: ${remainingWalletBalance}`);
  console.log(`- Users with wallet.balance: ${usersWithWalletBalanceField}`);

  if (remainingWalletBalance === 0) {
    console.log('\n✅ Migration completed successfully!');
    console.log('All users now use wallet.balance consistently.');
  } else {
    console.log('\n⚠️ Warning: Some users still have walletBalance field');
  }

  // Step 6: Show sample of migrated data
  console.log('\n📋 Sample of migrated data:');
  const sampleUsers = await User.find({ 'wallet.balance': { $exists: true } })
    .select('email wallet.balance wallet.currency')
    .limit(3)
    .lean();
  
  sampleUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}: ${user.wallet?.balance} ${user.wallet?.currency}`);
  });

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
}

console.log('\n🎉 Migration script completed!');
