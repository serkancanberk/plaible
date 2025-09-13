import 'dotenv/config';
import mongoose from 'mongoose';
import { UserStorySession } from '../models/UserStorySession.js';
import { User } from '../models/User.js';
import { Story } from '../models/Story.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');

  try {
    // Check if we have users and stories to work with
    const userCount = await User.countDocuments();
    const storyCount = await Story.countDocuments();
    
    console.log(`Found ${userCount} users and ${storyCount} stories in database`);
    
    if (userCount === 0) {
      console.log('⚠️  No users found. Please seed users first.');
      process.exit(1);
    }
    
    if (storyCount === 0) {
      console.log('⚠️  No stories found. Please seed stories first.');
      process.exit(1);
    }

    // Get a sample user and story
    const sampleUser = await User.findOne();
    const sampleStory = await Story.findOne();
    
    console.log(`Using sample user: ${sampleUser.displayName} (${sampleUser._id})`);
    console.log(`Using sample story: ${sampleStory.title} (${sampleStory._id})`);

    // Check if mock sessions already exist
    const existingSessions = await UserStorySession.find({ 
      userId: sampleUser._id,
      storyId: sampleStory._id 
    });
    
    if (existingSessions.length > 0) {
      console.log('✅ Mock user story sessions already exist');
      console.log(`Found ${existingSessions.length} existing sessions`);
      
      // Display existing sessions
      existingSessions.forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.toneStyleId} + ${session.timeFlavorId} (${session.status})`);
      });
    } else {
      console.log('🔄 Creating mock user story sessions...');
      
      // Create mock sessions with different flavor combinations
      const mockSessions = [
        {
          userId: sampleUser._id,
          storyId: sampleStory._id,
          toneStyleId: "original",
          timeFlavorId: "original",
          storyPrompt: `You are an AI storyteller for "${sampleStory.title}" by ${sampleStory.authorName}. Stay true to the original author's tone and style. Keep the story in its original time period. Your role is to guide the user through this classic tale while maintaining the authentic voice and setting.`,
          status: "active",
          currentChapter: 1,
          chaptersGenerated: 0,
          userPreferences: {
            preferredPacing: "medium",
            contentSensitivity: "medium",
            interactionStyle: "interactive"
          }
        },
        {
          userId: sampleUser._id,
          storyId: sampleStory._id,
          toneStyleId: "horror",
          timeFlavorId: "today",
          storyPrompt: `You are an AI storyteller for "${sampleStory.title}" by ${sampleStory.authorName}. Add suspense, fear, and supernatural elements to create a horror experience. Adapt the story to modern times with current technology and culture. Your role is to create a chilling, contemporary version of this classic tale.`,
          status: "active",
          currentChapter: 3,
          chaptersGenerated: 2,
          userPreferences: {
            preferredPacing: "fast",
            contentSensitivity: "high",
            interactionStyle: "immersive"
          }
        },
        {
          userId: sampleUser._id,
          storyId: sampleStory._id,
          toneStyleId: "romance",
          timeFlavorId: "nostalgic",
          storyPrompt: `You are an AI storyteller for "${sampleStory.title}" by ${sampleStory.authorName}. Focus on relationships, love, and emotional connections. Set the story in a romanticized past with vintage charm. Your role is to weave a romantic narrative that emphasizes the emotional depth and relationships in this timeless story.`,
          status: "finished",
          currentChapter: 5,
          chaptersGenerated: 5,
          userPreferences: {
            preferredPacing: "slow",
            contentSensitivity: "low",
            interactionStyle: "passive"
          }
        },
        {
          userId: sampleUser._id,
          storyId: sampleStory._id,
          toneStyleId: "sci-fi",
          timeFlavorId: "futuristic",
          storyPrompt: `You are an AI storyteller for "${sampleStory.title}" by ${sampleStory.authorName}. Add futuristic technology and scientific concepts. Transport the story to a distant future with advanced technology. Your role is to reimagine this classic tale in a high-tech, science fiction setting while maintaining the core narrative elements.`,
          status: "abandoned",
          currentChapter: 2,
          chaptersGenerated: 1,
          userPreferences: {
            preferredPacing: "fast",
            contentSensitivity: "medium",
            interactionStyle: "interactive"
          }
        }
      ];

      // Insert mock sessions
      const createdSessions = await UserStorySession.insertMany(mockSessions);
      console.log(`✅ Created ${createdSessions.length} mock user story sessions`);
      
      // Display created sessions
      createdSessions.forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.toneStyleId} + ${session.timeFlavorId} (${session.status}) - Chapter ${session.currentChapter}`);
      });
    }

    // Test the static methods
    console.log('\n🧪 Testing static methods...');
    
    // Test flavor combination validation
    const validationResult = await UserStorySession.validateFlavorCombination("drama", "today");
    console.log(`✅ validateFlavorCombination('drama', 'today'):`, validationResult);
    
    // Test getting active sessions
    const activeSessions = await UserStorySession.getActiveSessions(sampleUser._id);
    console.log(`✅ getActiveSessions() returned ${activeSessions.length} active sessions`);
    
    // Test getting sessions by story
    const storySessions = await UserStorySession.getSessionsByStory(sampleStory._id);
    console.log(`✅ getSessionsByStory() returned ${storySessions.length} sessions for story`);
    
    // Test flavor statistics
    const flavorStats = await UserStorySession.getFlavorStats();
    console.log(`✅ getFlavorStats() returned ${flavorStats.length} flavor combinations`);
    
    if (flavorStats.length > 0) {
      console.log('   Most popular combinations:');
      flavorStats.slice(0, 3).forEach((stat, index) => {
        console.log(`     ${index + 1}. ${stat._id.toneStyleId} + ${stat._id.timeFlavorId}: ${stat.count} sessions`);
      });
    }

    // Test instance methods
    console.log('\n🧪 Testing instance methods...');
    const testSession = await UserStorySession.findOne({ status: "active" });
    if (testSession) {
      console.log(`✅ Testing with session: ${testSession.toneStyleId} + ${testSession.timeFlavorId}`);
      
      // Test advance chapter
      const originalChapter = testSession.currentChapter;
      await testSession.advanceChapter();
      console.log(`✅ advanceChapter(): ${originalChapter} → ${testSession.currentChapter}`);
      
      // Test update activity
      const originalActivity = testSession.lastActivityAt;
      await testSession.updateActivity();
      console.log(`✅ updateActivity(): ${originalActivity} → ${testSession.lastActivityAt}`);
    }

    console.log('\n🎊 User story sessions setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up user story sessions:', error);
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
