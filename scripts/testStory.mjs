import 'dotenv/config';
import mongoose from 'mongoose';
import { Story } from '../models/Story.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log('Mongo connected');

  const s = await Story.findById('story_dorian_gray');
  if (!s) {
    console.error('Seeded story not found. Run: npm run seed:story');
    process.exit(1);
  }

  await s.incrementPlayed();
  await s.addFeedback({
    profilePictureUrl: 'https://cdn.plaible.art/users/test/profile.jpg',
    displayName: 'Test User',
    text: 'Nice pacing and strong choices.',
    stars: 5
  });
  await s.incrementSaved();

  const fresh = await Story.findById('story_dorian_gray');
  console.log('Stats:', fresh.stats);
  console.log('Last feedback:', fresh.feedbacks.at(-1));

  await mongoose.disconnect();
  console.log('Done');
}
run().catch(e => { console.error(e); process.exit(1); }); 