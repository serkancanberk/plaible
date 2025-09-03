import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

const uri = process.env.MONGODB_URI;
async function run() {
  await mongoose.connect(uri);
  const user = await User.findOne({ email: process.env.TEST_USER_EMAIL || 'serkan.caniberk@gmail.com' });
  if (!user) {
    console.log("No test user found");
    process.exit(1);
  }
  console.log("Before balance:", user.wallet?.balance ?? 0);

  const updated = await User.findByIdAndUpdate(
    user._id,
    { $inc: { "wallet.balance": 100 } },
    { new: true }
  );
  console.log("After +100 balance:", updated.wallet?.balance ?? 0);

  await mongoose.disconnect();
  console.log("Done");
}
run().catch(e => { console.error(e); process.exit(1); });
