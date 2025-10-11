import 'dotenv/config';
import mongoose from 'mongoose';
import { Story } from '../models/Story.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function fixFrankenstein() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Mongo connected');

  try {
    // Update Frankenstein to classic-novels
    console.log('🔄 Updating Frankenstein subcategory...');
    const result = await Story.updateOne(
      { slug: 'frankenstein' },
      { $set: { subCategory: 'classic-novels' } }
    );

    console.log('✅ Frankenstein updated:', result.modifiedCount > 0 ? 'SUCCESS' : 'NO CHANGES');

    // Verify both stories
    const stories = await Story.find({
      mainCategory: 'books',
      subCategory: 'classic-novels'
    }).select('_id slug title authorName mainCategory subCategory');

    console.log(`✅ Found ${stories.length} stories in books/classic-novels:`);
    stories.forEach(s => console.log(`  - ${s.title} by ${s.authorName} (${s.slug})`));

    if (stories.length >= 2) {
      console.log('🎉 SUCCESS: Target URL will now show 2+ stories!');
    } else {
      console.log('⚠️  WARNING: Still only 1 story in target category');
    }

  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Mongo disconnected');
  }
}

// Run the fix
fixFrankenstein().catch((error) => {
  console.error('Fix failed:', error);
  process.exit(1);
});
