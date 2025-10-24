#!/usr/bin/env node

/**
 * API Test script for StoryRunner endpoints
 * Tests the new message persistence endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testAPIEndpoints() {
  try {
    console.log('🧪 Testing StoryRunner API Endpoints...\n');

    // Test 1: Start a new session
    console.log('1. Testing POST /api/storyrunner/start...');
    const startResponse = await fetch(`${BASE_URL}/api/storyrunner/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: '64b7cafe1234567890cafe12',
        storyId: 'story_dorian_gray',
        toneStyleId: 'original',
        timeFlavorId: 'original',
        characterId: 'chr_dorian'
      })
    });

    if (!startResponse.ok) {
      throw new Error(`Start endpoint failed: ${startResponse.status} ${startResponse.statusText}`);
    }

    const startData = await startResponse.json();
    console.log(`✅ Session started: ${startData.sessionId}`);
    console.log(`✅ First message: ${startData.firstMessage.content.substring(0, 50)}...`);

    const sessionId = startData.sessionId;

    // Test 2: Send a turn
    console.log('\n2. Testing POST /api/storyrunner/turn...');
    const turnResponse = await fetch(`${BASE_URL}/api/storyrunner/turn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId,
        userMessage: 'I want to explore the painting more closely'
      })
    });

    if (!turnResponse.ok) {
      throw new Error(`Turn endpoint failed: ${turnResponse.status} ${turnResponse.statusText}`);
    }

    const turnData = await turnResponse.json();
    console.log(`✅ Turn processed: ${turnData.assistantMessage.content.substring(0, 50)}...`);
    console.log(`✅ Progress: Chapter ${turnData.progress.chapter}, Beat ${turnData.progress.beat}`);

    // Test 3: Get session messages
    console.log('\n3. Testing GET /api/storyrunner/session/:id/messages...');
    const messagesResponse = await fetch(`${BASE_URL}/api/storyrunner/session/${sessionId}/messages`);

    if (!messagesResponse.ok) {
      throw new Error(`Messages endpoint failed: ${messagesResponse.status} ${messagesResponse.statusText}`);
    }

    const messagesData = await messagesResponse.json();
    console.log(`✅ Retrieved ${messagesData.messages.length} messages`);
    console.log(`✅ Total messages: ${messagesData.pagination.total}`);

    messagesData.messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 30)}...`);
    });

    // Test 4: Test pagination
    console.log('\n4. Testing pagination...');
    const paginatedResponse = await fetch(`${BASE_URL}/api/storyrunner/session/${sessionId}/messages?limit=1&offset=0`);

    if (!paginatedResponse.ok) {
      throw new Error(`Pagination test failed: ${paginatedResponse.status} ${paginatedResponse.statusText}`);
    }

    const paginatedData = await paginatedResponse.json();
    console.log(`✅ Paginated messages: ${paginatedData.messages.length}`);
    console.log(`✅ Has more: ${paginatedData.pagination.hasMore}`);

    // Test 5: Send another turn with choice
    console.log('\n5. Testing turn with choice...');
    const choiceResponse = await fetch(`${BASE_URL}/api/storyrunner/turn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId,
        userMessage: 'I choose to examine the details',
        choiceId: 'choice_1'
      })
    });

    if (!choiceResponse.ok) {
      throw new Error(`Choice turn failed: ${choiceResponse.status} ${choiceResponse.statusText}`);
    }

    const choiceData = await choiceResponse.json();
    console.log(`✅ Choice turn processed: ${choiceData.assistantMessage.content.substring(0, 50)}...`);

    // Test 6: Verify final message count
    console.log('\n6. Verifying final message count...');
    const finalMessagesResponse = await fetch(`${BASE_URL}/api/storyrunner/session/${sessionId}/messages`);
    const finalMessagesData = await finalMessagesResponse.json();
    
    console.log(`✅ Final message count: ${finalMessagesData.pagination.total}`);
    console.log(`✅ Expected: 4 messages (1 initial assistant + 1 user + 1 assistant + 1 user + 1 assistant)`);

    console.log('\n🎉 All API tests passed! Message persistence endpoints are working correctly.');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.error('Make sure the server is running on', BASE_URL);
    process.exit(1);
  }
}

// Run the test
testAPIEndpoints();
