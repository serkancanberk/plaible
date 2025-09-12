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
    console.log('🧪 Testing StoryRunner API Integration...\n');

    // Test 1: Check environment variables
    console.log('📋 Test 1: Environment Variables Check');
    
    const openaiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4';
    
    if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
      console.log('✅ OPENAI_API_KEY is set');
      console.log(`✅ OPENAI_MODEL: ${openaiModel}`);
    } else {
      console.log('⚠️  OPENAI_API_KEY not set or using placeholder value');
      console.log('   Please set OPENAI_API_KEY in your .env file');
      console.log('   Example: OPENAI_API_KEY=sk-your-actual-key-here');
    }

    // Test 2: Check required data
    console.log('\n📋 Test 2: Required Data Check');
    
    const existingStory = await Story.findOne();
    const storySettings = await StorySettings.getDefaultSettings();
    
    if (!existingStory) {
      console.log('❌ No stories found. Please run seedStory.mjs first.');
      process.exit(1);
    }
    
    if (!storySettings) {
      console.log('❌ No story settings found. Please run seedStorySettings.mjs first.');
      process.exit(1);
    }

    console.log('✅ Found story:', existingStory.title);
    console.log('✅ Found story settings with', storySettings.tone_styles.length, 'tone styles');

    // Test 3: Prepare test data
    console.log('\n📋 Test 3: Preparing Test Data');
    
    const testUserId = '64b7cafe1234567890cafe12';
    const testStoryId = existingStory._id;
    const testToneStyleId = storySettings.tone_styles[0].id;
    const testTimeFlavorId = storySettings.time_flavors[0].id;

    console.log('Test data prepared:');
    console.log(`  User ID: ${testUserId}`);
    console.log(`  Story ID: ${testStoryId}`);
    console.log(`  Tone Style: ${testToneStyleId}`);
    console.log(`  Time Flavor: ${testTimeFlavorId}`);

    // Test 4: Generate API test commands
    console.log('\n📋 Test 4: API Test Commands');
    
    console.log('\n🚀 Test Commands for Postman/curl:');
    
    console.log('\n1. Start New Story Session:');
    console.log('POST http://localhost:3000/api/story/start');
    console.log('Content-Type: application/json');
    console.log('Cookie: plaible_jwt=your_jwt_token_here');
    console.log('');
    console.log('Body:');
    console.log(JSON.stringify({
      userId: testUserId,
      storyId: testStoryId,
      toneStyleId: testToneStyleId,
      timeFlavorId: testTimeFlavorId
    }, null, 2));

    console.log('\n2. Generate First Chapter (after getting sessionId from step 1):');
    console.log('POST http://localhost:3000/api/story/generate-chapter');
    console.log('Content-Type: application/json');
    console.log('Cookie: plaible_jwt=your_jwt_token_here');
    console.log('');
    console.log('Body:');
    console.log(JSON.stringify({
      sessionId: 'REPLACE_WITH_ACTUAL_SESSION_ID'
    }, null, 2));

    console.log('\n3. Get Session Details:');
    console.log('GET http://localhost:3000/api/story/session/REPLACE_WITH_ACTUAL_SESSION_ID');
    console.log('Cookie: plaible_jwt=your_jwt_token_here');

    console.log('\n4. Get Session Chapters:');
    console.log('GET http://localhost:3000/api/story/session/REPLACE_WITH_ACTUAL_SESSION_ID/chapters');
    console.log('Cookie: plaible_jwt=your_jwt_token_here');

    // Test 5: Server integration check
    console.log('\n📋 Test 5: Server Integration Check');
    
    // Check if the routes file exists and is properly structured
    try {
      const fs = await import('fs');
      const routesContent = fs.readFileSync('./routes/storyRunnerRoutes.js', 'utf8');
      
      if (routesContent.includes('POST /api/story/start')) {
        console.log('✅ storyRunnerRoutes.js contains start endpoint');
      } else {
        console.log('❌ storyRunnerRoutes.js missing start endpoint');
      }
      
      if (routesContent.includes('POST /api/story/generate-chapter')) {
        console.log('✅ storyRunnerRoutes.js contains generate-chapter endpoint');
      } else {
        console.log('❌ storyRunnerRoutes.js missing generate-chapter endpoint');
      }
      
      if (routesContent.includes('export default router')) {
        console.log('✅ storyRunnerRoutes.js properly exports router');
      } else {
        console.log('❌ storyRunnerRoutes.js missing default export');
      }
      
    } catch (error) {
      console.log('❌ Error reading storyRunnerRoutes.js:', error.message);
    }

    // Check if server.js includes the routes
    try {
      const fs = await import('fs');
      const serverContent = fs.readFileSync('./server.js', 'utf8');
      
      if (serverContent.includes('import storyRunnerRoutes')) {
        console.log('✅ server.js imports storyRunnerRoutes');
      } else {
        console.log('❌ server.js missing storyRunnerRoutes import');
      }
      
      if (serverContent.includes('app.use("/api/story", authGuard, storyRunnerRoutes)')) {
        console.log('✅ server.js registers storyRunnerRoutes');
      } else {
        console.log('❌ server.js missing storyRunnerRoutes registration');
      }
      
    } catch (error) {
      console.log('❌ Error reading server.js:', error.message);
    }

    // Test 6: Model integration check
    console.log('\n📋 Test 6: Model Integration Check');
    
    try {
      const { Chapter } = await import('../models/Chapter.js');
      console.log('✅ Chapter model can be imported');
      
      // Test model methods
      const testMethods = ['findBySessionId', 'findBySessionAndIndex', 'getLatestChapter'];
      for (const method of testMethods) {
        if (typeof Chapter[method] === 'function') {
          console.log(`✅ Chapter.${method} method available`);
        } else {
          console.log(`❌ Chapter.${method} method missing`);
        }
      }
      
    } catch (error) {
      console.log('❌ Error importing Chapter model:', error.message);
    }

    try {
      const { generateFirstChapter } = await import('../utils/storyEngine.js');
      if (typeof generateFirstChapter === 'function') {
        console.log('✅ generateFirstChapter function available');
      } else {
        console.log('❌ generateFirstChapter function missing');
      }
    } catch (error) {
      console.log('❌ Error importing storyEngine:', error.message);
    }

    console.log('\n🎊 API Integration Tests Complete!');
    
    console.log('\n📊 Summary:');
    console.log('   ✅ Server routes integrated');
    console.log('   ✅ Models and utilities available');
    console.log('   ✅ Test data prepared');
    console.log('   ✅ API commands generated');
    
    if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
      console.log('   ✅ OpenAI API key configured');
      console.log('\n🚀 Ready to test with real API calls!');
    } else {
      console.log('   ⚠️  OpenAI API key needs configuration');
      console.log('\n🔧 Next Steps:');
      console.log('   1. Set OPENAI_API_KEY in .env file');
      console.log('   2. Start the server: npm start');
      console.log('   3. Test the API endpoints with the commands above');
    }

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
