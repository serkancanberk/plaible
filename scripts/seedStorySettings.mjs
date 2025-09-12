import 'dotenv/config';
import mongoose from 'mongoose';
import { StorySettings } from '../models/StorySettings.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');

  try {
    // Check if default settings already exist
    const existingSettings = await StorySettings.findOne({ _id: "default" });
    
    if (existingSettings) {
      console.log('✅ Default story settings already exist');
      console.log('Tone Styles:', existingSettings.tone_styles.length);
      console.log('Time Flavors:', existingSettings.time_flavors.length);
      
      // Display current settings
      console.log('\n📋 Current Tone Styles:');
      existingSettings.tone_styles.forEach(style => {
        console.log(`  • ${style.id}: ${style.displayLabel} - ${style.description}`);
      });
      
      console.log('\n📋 Current Time Flavors:');
      existingSettings.time_flavors.forEach(flavor => {
        console.log(`  • ${flavor.id}: ${flavor.displayLabel} - ${flavor.description}`);
      });
    } else {
      console.log('🔄 Creating default story settings...');
      
      // Create default settings using the model defaults
      const defaultSettings = new StorySettings({
        _id: "default",
        version: "1.0.0",
        isActive: true
      });
      
      await defaultSettings.save();
      console.log('✅ Default story settings created successfully');
      
      // Display created settings
      console.log('\n📋 Created Tone Styles:');
      defaultSettings.tone_styles.forEach(style => {
        console.log(`  • ${style.id}: ${style.displayLabel} - ${style.description}`);
      });
      
      console.log('\n📋 Created Time Flavors:');
      defaultSettings.time_flavors.forEach(flavor => {
        console.log(`  • ${flavor.id}: ${flavor.displayLabel} - ${flavor.description}`);
      });
    }

    // Test the static methods
    console.log('\n🧪 Testing static methods...');
    
    const toneStyles = await StorySettings.getToneStyles();
    console.log(`✅ getToneStyles() returned ${toneStyles.length} styles`);
    
    const timeFlavors = await StorySettings.getTimeFlavors();
    console.log(`✅ getTimeFlavors() returned ${timeFlavors.length} flavors`);
    
    const isValidTone = await StorySettings.isValidToneStyle('drama');
    console.log(`✅ isValidToneStyle('drama') returned: ${isValidTone}`);
    
    const isValidTime = await StorySettings.isValidTimeFlavor('futuristic');
    console.log(`✅ isValidTimeFlavor('futuristic') returned: ${isValidTime}`);
    
    const invalidTone = await StorySettings.isValidToneStyle('invalid');
    console.log(`✅ isValidToneStyle('invalid') returned: ${invalidTone}`);

    console.log('\n🎊 Story settings setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up story settings:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

run().catch(e => { 
  console.error('❌ Script failed:', e); 
  process.exit(1); 
});
