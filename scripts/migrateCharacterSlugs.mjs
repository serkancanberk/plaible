import 'dotenv/config';
import mongoose from 'mongoose';
import { Story } from '../models/Story.js';

const MONGODB_URI = process.env.MONGODB_URI;

// Helper function to create slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/['".,!?()+/]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

async function run() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Mongo connected');

  try {
    // Find all stories
    const stories = await Story.find({}).lean();
    console.log(`Found ${stories.length} stories to process`);

    let updatedCount = 0;

    for (const story of stories) {
      let needsUpdate = false;
      const updatedCharacters = story.characters.map(character => {
        // Only add slug if it doesn't exist or is empty
        if (!character.slug || character.slug === '') {
          const slug = createSlug(character.name);
          console.log(`Adding slug "${slug}" to character "${character.name}" in story "${story.title}"`);
          needsUpdate = true;
          return { ...character, slug };
        }
        return character;
      });

      if (needsUpdate) {
        await Story.updateOne(
          { _id: story._id },
          { $set: { characters: updatedCharacters } }
        );
        updatedCount++;
        console.log(`✅ Updated story: ${story.title}`);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Updated ${updatedCount} stories`);
    console.log(`📝 Added character slugs to all stories`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run().catch(e => { 
  console.error('❌ Script failed:', e); 
  process.exit(1); 
});
