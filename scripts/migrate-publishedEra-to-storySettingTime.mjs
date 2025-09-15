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

  try {
    // Find all stories that have publishedEra but no storySettingTime
    const storiesToMigrate = await Story.find({
      publishedEra: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { storySettingTime: { $exists: false } },
        { storySettingTime: null },
        { storySettingTime: '' }
      ]
    });

    console.log(`Found ${storiesToMigrate.length} stories to migrate`);

    if (storiesToMigrate.length === 0) {
      console.log('No stories need migration');
      await mongoose.disconnect();
      return;
    }

    // Migrate each story
    let migratedCount = 0;
    for (const story of storiesToMigrate) {
      try {
        await Story.updateOne(
          { _id: story._id },
          { 
            $set: { 
              storySettingTime: story.publishedEra,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`✅ Migrated story: ${story.title} (${story._id}) - "${story.publishedEra}" → "${story.publishedEra}"`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate story ${story._id}:`, error.message);
      }
    }

    console.log(`\n🎉 Migration completed! Migrated ${migratedCount} out of ${storiesToMigrate.length} stories`);

    // Optional: Remove publishedEra field after migration (uncomment if desired)
    // console.log('\n🧹 Removing publishedEra field from all stories...');
    // const removeResult = await Story.updateMany(
    //   {},
    //   { $unset: { publishedEra: 1 } }
    // );
    // console.log(`Removed publishedEra field from ${removeResult.modifiedCount} stories`);

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Done');
  }
}

run().catch(e => { 
  console.error(e); 
  process.exit(1); 
});
