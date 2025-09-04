import 'dotenv/config';
import mongoose from 'mongoose';
import { Story } from '../models/Story.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  const s = await Story.findOne({ slug: 'the-picture-of-dorian-gray' });
  console.log('Before stats:', s?.stats);

  // pretend an API call happened: push a fake review
  s.feedbacks = s.feedbacks || [];
  s.feedbacks.push({
    profilePictureUrl: 'https://cdn.plaible.art/users/test/profile.jpg',
    displayName: 'CLI User',
    text: 'Taut and stylish.',
    stars: 5,
    date: new Date()
  });
  const rated = s.feedbacks.filter(x => typeof x.stars === 'number' && x.stars > 0);
  const totalReviews = rated.length;
  const avgRating = totalReviews ? Math.round((rated.reduce((a,b)=>a+b.stars,0)/totalReviews)*10)/10 : 0;
  s.stats = { ...(s.stats||{}), totalReviews, avgRating };
  await s.save();

  const after = await Story.findById(s._id);
  console.log('After stats:', after.stats);
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });


