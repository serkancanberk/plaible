import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Mongo connected');

  const testUserId = new mongoose.Types.ObjectId("64b7cafe1234567890cafe12");
  
  const userDoc = {
    _id: testUserId,
    fullName: 'Test User',
    displayName: 'testuser',
    email: 'test@example.com',
    walletBalance: 100, // Start with 100 credits
    isVerified: true,
    language: 'en'
  };

  await User.updateOne({ _id: userDoc._id }, { $set: userDoc }, { upsert: true });
  const saved = await User.findById(userDoc._id);
  console.log('Saved user:', saved?.displayName, 'with balance:', saved?.walletBalance);

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(e => { console.error(e); process.exit(1); });
