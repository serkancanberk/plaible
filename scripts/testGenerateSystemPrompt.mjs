import 'dotenv/config';
import mongoose from 'mongoose';
import { generateStoryPrompt, generateStoryPromptForNewSession, validateStoryPromptGeneration } from '../src/utils/generateStoryPrompt.js';
import { UserStorySession } from '../models/UserStorySession.js';
import { Story } from '../models/Story.js';
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
    console.log('🧪 Testing generateStoryPrompt utility function...\n');

    // Test 1: Get an existing session
    const existingSession = await UserStorySession.findOne();
    if (!existingSession) {
      console.log('❌ No existing sessions found. Please run seedUserStorySessions.mjs first.');
      process.exit(1);
    }

    console.log('📋 Test 1: Generate prompt for existing session');
    console.log(`Session ID: ${existingSession._id}`);
    console.log(`Story ID: ${existingSession.storyId}`);
    console.log(`Tone Style: ${existingSession.toneStyleId}`);
    console.log(`Time Flavor: ${existingSession.timeFlavorId}\n`);

    const generatedPrompt = await generateStoryPrompt(existingSession._id.toString());
    if (generatedPrompt) {
      console.log('✅ System prompt generated successfully!');
      console.log('Generated Prompt:');
      console.log('─'.repeat(80));
      console.log(generatedPrompt);
      console.log('─'.repeat(80));
    } else {
      console.log('❌ Failed to generate system prompt');
    }

    console.log('\n📋 Test 2: Generate prompt for new session (without sessionId)');
    const story = await Story.findOne();
    const storySettings = await StorySettings.getDefaultSettings();
    
    let toneStyle, timeFlavor;
    
    if (story && storySettings) {
      toneStyle = storySettings.tone_styles[1]; // Get second tone style
      timeFlavor = storySettings.time_flavors[1]; // Get second time flavor
      
      console.log(`Story ID: ${story._id}`);
      console.log(`Tone Style: ${toneStyle.id} (${toneStyle.displayLabel})`);
      console.log(`Time Flavor: ${timeFlavor.id} (${timeFlavor.displayLabel})\n`);

      const newSessionPrompt = await generateStoryPromptForNewSession(
        story._id,
        toneStyle.id,
        timeFlavor.id
      );
      
      if (newSessionPrompt) {
        console.log('✅ System prompt for new session generated successfully!');
        console.log('Generated Prompt:');
        console.log('─'.repeat(80));
        console.log(newSessionPrompt);
        console.log('─'.repeat(80));
      } else {
        console.log('❌ Failed to generate system prompt for new session');
      }
    }

    console.log('\n📋 Test 3: Validation function');
    const validationResult = await validateStoryPromptGeneration(
      story._id,
      toneStyle.id,
      timeFlavor.id
    );
    
    console.log('Validation Result:', validationResult);
    if (validationResult.isValid) {
      console.log('✅ Validation passed');
    } else {
      console.log('❌ Validation failed:', validationResult.errors);
    }

    console.log('\n📋 Test 4: Test with invalid parameters');
    const invalidValidation = await validateStoryPromptGeneration(
      'invalid_story_id',
      'invalid_tone',
      'invalid_time'
    );
    
    console.log('Invalid Parameters Validation:', invalidValidation);
    if (!invalidValidation.isValid) {
      console.log('✅ Correctly identified invalid parameters');
    } else {
      console.log('❌ Should have failed validation');
    }

    console.log('\n📋 Test 5: Test placeholder interpolation');
    console.log('Testing with a custom base prompt...');
    
    // Create a test story with a custom prompt template
    const testStory = {
      _id: 'test_story',
      title: 'Test Story',
      authorName: 'Test Author',
      description: 'A test story for prompt generation',
      storyrunner: {
        storyPrompt: `You are an AI storyteller for "{{STORY_TITLE}}" by {{AUTHOR_NAME}}.

Story Description: {{STORY_DESCRIPTION}}

Tone Style: {{TONE_STYLE}} - {{TONE_DESCRIPTION}}
Time Flavor: {{TIME_FLAVOR}} - {{TIME_DESCRIPTION}}

Opening Beats:
{{OPENING_BEATS}}

Safety Guardrails:
{{SAFETY_GUARDRAILS}}

Your role is to guide the user through this story with the specified tone and time setting.`,
        openingBeats: [
          'The story begins with a mysterious event',
          'The protagonist discovers something unexpected',
          'A conflict arises that changes everything'
        ],
        guardrails: [
          'Maintain age-appropriate content',
          'Avoid explicit violence',
          'Respect character boundaries'
        ]
      }
    };

    const testPrompt = await generateStoryPromptForNewSession(
      testStory._id,
      'horror',
      'futuristic'
    );
    
    if (testPrompt) {
      console.log('✅ Custom prompt template interpolation successful!');
      console.log('Interpolated Prompt:');
      console.log('─'.repeat(80));
      console.log(testPrompt);
      console.log('─'.repeat(80));
    } else {
      console.log('❌ Failed to interpolate custom prompt template');
    }

    console.log('\n🎊 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
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
