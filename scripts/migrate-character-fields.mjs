import 'dotenv/config';
import mongoose from 'mongoose';
import { Story } from '../models/Story.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateCharacterFields() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Mongo connected');

  try {
    // Find all stories with characters
    const stories = await Story.find({ 
      characters: { $exists: true, $ne: [] } 
    }).lean();

    console.log(`Found ${stories.length} stories with characters`);

    let totalCharactersUpdated = 0;
    let storiesUpdated = 0;

    for (const story of stories) {
      let hasUpdates = false;
      const updatedCharacters = story.characters.map(char => {
        const updatedChar = { ...char };
        
        // Add default values if fields are missing
        if (updatedChar.helloMessage === undefined) {
          updatedChar.helloMessage = "";
          hasUpdates = true;
        }
        if (updatedChar.onboardingText === undefined) {
          updatedChar.onboardingText = "";
          hasUpdates = true;
        }
        
        return updatedChar;
      });

      if (hasUpdates) {
        await Story.updateOne(
          { _id: story._id },
          { $set: { characters: updatedCharacters } }
        );
        
        totalCharactersUpdated += story.characters.length;
        storiesUpdated++;
        console.log(`✅ Updated story: ${story.title} (${story.characters.length} characters)`);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`- Stories updated: ${storiesUpdated}`);
    console.log(`- Characters updated: ${totalCharactersUpdated}`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateCharacterFields();
