#!/usr/bin/env node

/**
 * Migration script: shortName → displayName
 * 
 * This script migrates existing shortName values to displayName field
 * and removes shortName from the database.
 * 
 * Usage: node scripts/migrate-shortName-to-displayName.mjs
 */

import mongoose from 'mongoose';
import { Story } from '../models/Story.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/plaible';

async function migrateShortNameToDisplayName() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔍 Finding stories with shortName values...');
    const stories = await Story.find({ 
      'characters.shortName': { $exists: true, $ne: '' } 
    });

    console.log(`📊 Found ${stories.length} stories with shortName values`);

    let totalUpdated = 0;
    let totalCharacters = 0;

    for (const story of stories) {
      let storyChanged = false;
      let characterCount = 0;

      for (const character of story.characters) {
        if (character.shortName && !character.displayName) {
          // Migrate shortName to displayName
          character.displayName = character.shortName;
          delete character.shortName;
          storyChanged = true;
          characterCount++;
          totalCharacters++;
        }
      }

      if (storyChanged) {
        await story.save();
        totalUpdated++;
        console.log(`✅ Updated story: ${story._id} (${characterCount} characters migrated)`);
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`📈 Summary:`);
    console.log(`   - Stories updated: ${totalUpdated}`);
    console.log(`   - Characters migrated: ${totalCharacters}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrateShortNameToDisplayName();
