import 'dotenv/config';
import mongoose from 'mongoose';
import { Brief } from '../models/Brief.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');

  try {
    // Check if default brief already exists
    const existingBrief = await Brief.findOne({ _id: "default" });
    
    if (existingBrief) {
      console.log('✅ Default brief already exists');
      console.log('Title:', existingBrief.title);
      console.log('Last Updated:', existingBrief.lastUpdated);
      
      // Display current brief content
      console.log('\n📋 Current Brief Content:');
      console.log('\n🎯 What\'s Plaible:');
      console.log(existingBrief.whatIsPlaible);
      console.log('\n🎮 How to Play:');
      console.log(existingBrief.howToPlay);
      console.log('\n🤖 Storyrunner Role:');
      console.log(existingBrief.storyrunnerRole);
      
      await mongoose.disconnect();
      return;
    }

    // Create default brief with provided content
    const defaultBrief = new Brief({
      _id: "default",
      title: "Default Brief",
      whatIsPlaible: "Plaible is an immersive AI storytelling engine.",
      howToPlay: "Select a character, tone, and timeline to begin your narrative journey.",
      storyrunnerRole: `You are a Storyrunner AI. You'll narrate a unique journey from the eyes of the user-chosen character, set in the world of Dorian Gray. As the AI: 
- You are the narrator, world-builder, and game master.
- Shape scenes based on character psychology, selected tone and era.
- Begin each chapter with a dramatic opener and end with a choice.
- Offer meaningful decisions with psychological or moral weight.
- Tailor language, mood, and pacing to match selected settings.`
    });

    await defaultBrief.save();
    console.log('✅ Default brief created successfully');
    console.log('Title:', defaultBrief.title);
    console.log('ID:', defaultBrief._id);
    
    // Display created brief content
    console.log('\n📋 Created Brief Content:');
    console.log('\n🎯 What\'s Plaible:');
    console.log(defaultBrief.whatIsPlaible);
    console.log('\n🎮 How to Play:');
    console.log(defaultBrief.howToPlay);
    console.log('\n🤖 Storyrunner Role:');
    console.log(defaultBrief.storyrunnerRole);

  } catch (error) {
    console.error('❌ Error seeding brief:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

run();
