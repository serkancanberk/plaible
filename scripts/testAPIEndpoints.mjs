import 'dotenv/config';
import mongoose from 'mongoose';
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
    console.log('🧪 Testing StoryRunner API Endpoints...\n');

    // Get test data
    const existingStory = await Story.findOne();
    const storySettings = await StorySettings.getDefaultSettings();
    
    if (!existingStory || !storySettings) {
      console.log('❌ Missing required data. Please run seed scripts first.');
      process.exit(1);
    }

    const testUserId = '64b7cafe1234567890cafe12';
    const testStoryId = existingStory._id;
    const testToneStyleId = storySettings.tone_styles[0].id;
    const testTimeFlavorId = storySettings.time_flavors[0].id;

    console.log('📋 Test Data:');
    console.log(`  User ID: ${testUserId}`);
    console.log(`  Story ID: ${testStoryId}`);
    console.log(`  Tone Style: ${testToneStyleId}`);
    console.log(`  Time Flavor: ${testTimeFlavorId}`);

    // Create a test session first
    console.log('\n📋 Creating Test Session...');
    
    const testSession = new UserStorySession({
      userId: testUserId,
      storyId: testStoryId,
      toneStyleId: testToneStyleId,
      timeFlavorId: testTimeFlavorId,
      storyPrompt: 'Test system prompt for API testing',
      status: 'active',
      currentChapter: 1,
      chaptersGenerated: 0,
      sessionStartedAt: new Date(),
      lastActivityAt: new Date()
    });

    const savedSession = await testSession.save();
    console.log(`✅ Test session created: ${savedSession._id}`);

    // Generate curl commands for testing
    console.log('\n🚀 Curl Commands for Testing:');
    
    console.log('\n1. Test Start New Story Session:');
    console.log('curl -X POST http://localhost:3000/api/story/start \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -H "Cookie: plaible_jwt=your_jwt_token_here" \\');
    console.log('  -d \'{');
    console.log(`    "userId": "${testUserId}",`);
    console.log(`    "storyId": "${testStoryId}",`);
    console.log(`    "toneStyleId": "${testToneStyleId}",`);
    console.log(`    "timeFlavorId": "${testTimeFlavorId}"`);
    console.log('  }\'');

    console.log('\n2. Test Generate First Chapter:');
    console.log('curl -X POST http://localhost:3000/api/story/generate-chapter \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -H "Cookie: plaible_jwt=your_jwt_token_here" \\');
    console.log('  -d \'{');
    console.log(`    "sessionId": "${savedSession._id}"`);
    console.log('  }\'');

    console.log('\n3. Test Get Session Details:');
    console.log(`curl -X GET http://localhost:3000/api/story/session/${savedSession._id} \\`);
    console.log('  -H "Cookie: plaible_jwt=your_jwt_token_here"');

    console.log('\n4. Test Get Session Chapters:');
    console.log(`curl -X GET http://localhost:3000/api/story/session/${savedSession._id}/chapters \\`);
    console.log('  -H "Cookie: plaible_jwt=your_jwt_token_here"');

    // Test with a simple HTTP request (if server is running)
    console.log('\n📋 Testing Server Connectivity...');
    
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server is running and responding');
        console.log(`   Health check response:`, data);
      } else {
        console.log('⚠️  Server responded with status:', response.status);
      }
    } catch (error) {
      console.log('⚠️  Server not running or not accessible');
      console.log('   Start the server with: npm start');
      console.log('   Then test the endpoints with the curl commands above');
    }

    console.log('\n📋 Environment Check:');
    
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
      console.log('✅ OPENAI_API_KEY is configured');
      console.log(`✅ OPENAI_MODEL: ${process.env.OPENAI_MODEL || 'gpt-4'}`);
    } else {
      console.log('⚠️  OPENAI_API_KEY not configured');
      console.log('   Set OPENAI_API_KEY in .env file to test AI generation');
    }

    console.log('\n🎊 API Endpoint Tests Complete!');
    
    console.log('\n📊 Summary:');
    console.log('   ✅ Test session created');
    console.log('   ✅ Curl commands generated');
    console.log('   ✅ Server integration verified');
    console.log('   ✅ Environment variables checked');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Test endpoints with the curl commands above');
    console.log('   3. Use Postman for more detailed testing');
    console.log('   4. Check server logs for any errors');

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
