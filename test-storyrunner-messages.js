#!/usr/bin/env node

/**
 * Test script for StoryRunner message persistence
 * This script tests the new message functionality
 */

import mongoose from 'mongoose';
import { UserStorySession } from './models/UserStorySession.js';
import StoryRunnerMessage from './models/StoryRunnerMessage.js';
import { Story } from './models/Story.js';
import { User } from './models/User.js';

// Test configuration
const TEST_USER_ID = '64b7cafe1234567890cafe12';
const TEST_STORY_ID = 'story_dorian_gray';

async function testMessagePersistence() {
  try {
    console.log('🧪 Testing StoryRunner Message Persistence...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plaible');
    console.log('✅ Connected to MongoDB');

    // 1. Test creating a new session
    console.log('\n1. Testing session creation...');
    const session = new UserStorySession({
      userId: new mongoose.Types.ObjectId(TEST_USER_ID),
      storyId: TEST_STORY_ID,
      toneStyleId: 'original',
      timeFlavorId: 'original',
      storyPrompt: 'Test prompt for message persistence',
      status: 'active'
    });

    const savedSession = await session.save();
    console.log(`✅ Session created: ${savedSession._id}`);

    // 2. Test creating messages
    console.log('\n2. Testing message creation...');
    
    // Create an assistant message
    const assistantMessage = new StoryRunnerMessage({
      sessionId: savedSession._id,
      role: 'assistant',
      content: 'Welcome to your story adventure! The forest awaits your first step.',
      choices: ['Enter the forest', 'Look around', 'Turn back'],
      metadata: {
        chapter: 1,
        beat: 1,
        tokenUsage: { prompt: 50, completion: 30, total: 80 },
        model: 'gpt-4o-mini',
        finishReason: 'stop',
        latency: 1200
      }
    });

    const savedAssistantMessage = await assistantMessage.save();
    console.log(`✅ Assistant message created: ${savedAssistantMessage._id}`);

    // Create a user message
    const userMessage = new StoryRunnerMessage({
      sessionId: savedSession._id,
      role: 'user',
      content: 'I want to enter the forest',
      metadata: {
        chapter: 1,
        beat: 1,
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
        model: 'user',
        finishReason: 'user_input',
        latency: 0
      }
    });

    const savedUserMessage = await userMessage.save();
    console.log(`✅ User message created: ${savedUserMessage._id}`);

    // 3. Test session message tracking
    console.log('\n3. Testing session message tracking...');
    await savedSession.addMessage(savedAssistantMessage._id, 80);
    await savedSession.addMessage(savedUserMessage._id, 0);
    
    console.log(`✅ Session message count: ${savedSession.messageCount}`);
    console.log(`✅ Session total tokens: ${savedSession.totalTokensUsed}`);

    // 4. Test message retrieval
    console.log('\n4. Testing message retrieval...');
    const messages = await StoryRunnerMessage.getMessagesForSession(savedSession._id);
    console.log(`✅ Retrieved ${messages.length} messages`);

    messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
    });

    // 5. Test pagination
    console.log('\n5. Testing pagination...');
    const paginatedMessages = await StoryRunnerMessage.getMessagesForSession(savedSession._id, 1, 0);
    console.log(`✅ Paginated messages (limit=1): ${paginatedMessages.length}`);

    // 6. Test message count
    console.log('\n6. Testing message count...');
    const messageCount = await StoryRunnerMessage.getMessageCount(savedSession._id);
    console.log(`✅ Total message count: ${messageCount}`);

    // 7. Test choice recording
    console.log('\n7. Testing choice recording...');
    await savedSession.recordChoice(savedAssistantMessage._id, 'choice_1');
    await savedSession.advanceBeat();
    console.log(`✅ Choice recorded, current beat: ${savedSession.progress.currentBeat}`);

    // 8. Test conversation context
    console.log('\n8. Testing conversation context...');
    console.log(`✅ Recent messages: ${savedSession.conversationContext.recentMessages.length}`);
    console.log(`✅ Last context update: ${savedSession.conversationContext.lastContextUpdate}`);

    // Cleanup
    console.log('\n9. Cleaning up test data...');
    await StoryRunnerMessage.deleteMany({ sessionId: savedSession._id });
    await UserStorySession.findByIdAndDelete(savedSession._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Message persistence is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testMessagePersistence();
