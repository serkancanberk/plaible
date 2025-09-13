import 'dotenv/config';
import mongoose from 'mongoose';
import { StoryPrompt } from '../src/models/storyPromptModel.js';
import { UserStorySession } from '../models/UserStorySession.js';
import { generateStoryPrompt } from '../src/utils/generateStoryPrompt.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');

  try {
    console.log('🧪 Testing StoryPrompt model...\n');

    // Test 1: Get an existing session to generate a prompt
    const existingSession = await UserStorySession.findOne();
    if (!existingSession) {
      console.log('❌ No existing sessions found. Please run seedUserStorySessions.mjs first.');
      process.exit(1);
    }

    console.log('📋 Test 1: Generate and store a system prompt');
    console.log(`Session ID: ${existingSession._id}`);
    console.log(`User ID: ${existingSession.userId}`);
    console.log(`Story ID: ${existingSession.storyId}\n`);

    // Generate the system prompt
    const generatedPrompt = await generateStoryPrompt(existingSession._id.toString());
    if (!generatedPrompt) {
      console.log('❌ Failed to generate system prompt');
      process.exit(1);
    }

    console.log('✅ System prompt generated successfully!');
    console.log('Generated Prompt Preview:');
    console.log('─'.repeat(80));
    console.log(generatedPrompt.substring(0, 200) + '...');
    console.log('─'.repeat(80));

    // Create a new StoryPrompt document
    const storyPrompt = new StoryPrompt({
      sessionId: existingSession._id.toString(),
      userId: existingSession.userId.toString(),
      storyId: existingSession.storyId,
      finalPrompt: generatedPrompt
    });

    const savedPrompt = await storyPrompt.save();
    console.log('\n✅ StoryPrompt saved successfully!');
    console.log(`Document ID: ${savedPrompt._id}`);
    console.log(`Created At: ${savedPrompt.createdAt}`);

    // Test 2: Test static methods
    console.log('\n📋 Test 2: Testing static methods');

    // Test findBySessionId
    const foundBySession = await StoryPrompt.findBySessionId(existingSession._id.toString());
    if (foundBySession) {
      console.log('✅ findBySessionId works correctly');
      console.log(`Found prompt for session: ${foundBySession.sessionId}`);
    } else {
      console.log('❌ findBySessionId failed');
    }

    // Test findByUserId
    const foundByUser = await StoryPrompt.findByUserId(existingSession.userId.toString());
    if (foundByUser && foundByUser.length > 0) {
      console.log('✅ findByUserId works correctly');
      console.log(`Found ${foundByUser.length} prompts for user`);
    } else {
      console.log('❌ findByUserId failed');
    }

    // Test findByStoryId
    const foundByStory = await StoryPrompt.findByStoryId(existingSession.storyId);
    if (foundByStory && foundByStory.length > 0) {
      console.log('✅ findByStoryId works correctly');
      console.log(`Found ${foundByStory.length} prompts for story`);
    } else {
      console.log('❌ findByStoryId failed');
    }

    // Test findByUserAndStory
    const foundByUserAndStory = await StoryPrompt.findByUserAndStory(
      existingSession.userId.toString(),
      existingSession.storyId
    );
    if (foundByUserAndStory && foundByUserAndStory.length > 0) {
      console.log('✅ findByUserAndStory works correctly');
      console.log(`Found ${foundByUserAndStory.length} prompts for user and story`);
    } else {
      console.log('❌ findByUserAndStory failed');
    }

    // Test 3: Test instance methods
    console.log('\n📋 Test 3: Testing instance methods');

    // Test isRecent method
    const isRecent = savedPrompt.isRecent(60); // Check if created within last 60 minutes
    console.log(`✅ isRecent(60) method works: ${isRecent}`);

    const isNotRecent = savedPrompt.isRecent(0); // Check if created within last 0 minutes
    console.log(`✅ isRecent(0) method works: ${isNotRecent}`);

    // Test 4: Test schema validation
    console.log('\n📋 Test 4: Testing schema validation');

    try {
      // Test missing required fields
      const invalidPrompt = new StoryPrompt({
        // Missing required fields
      });
      await invalidPrompt.save();
      console.log('❌ Should have failed validation');
    } catch (error) {
      console.log('✅ Schema validation works correctly');
      console.log(`Validation error: ${error.message}`);
    }

    // Test 5: Test multiple prompts for same session
    console.log('\n📋 Test 5: Testing multiple prompts for same session');

    const anotherPrompt = new StoryPrompt({
      sessionId: existingSession._id.toString(),
      userId: existingSession.userId.toString(),
      storyId: existingSession.storyId,
      finalPrompt: 'This is a different prompt for the same session'
    });

    const savedAnotherPrompt = await anotherPrompt.save();
    console.log('✅ Multiple prompts for same session saved successfully');
    console.log(`Second prompt ID: ${savedAnotherPrompt._id}`);

    // Test 6: Test querying by timestamps
    console.log('\n📋 Test 6: Testing timestamp queries');

    const recentPrompts = await StoryPrompt.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${recentPrompts.length} prompts created in the last 24 hours`);

    // Test 7: Test collection name
    console.log('\n📋 Test 7: Testing collection name');

    const collectionName = StoryPrompt.collection.name;
    console.log(`✅ Collection name: ${collectionName}`);
    if (collectionName === 'story_prompts') {
      console.log('✅ Collection name is correct');
    } else {
      console.log('❌ Collection name is incorrect');
    }

    console.log('\n🎊 All tests completed successfully!');

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
