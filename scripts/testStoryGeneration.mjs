#!/usr/bin/env node

// Test script for story content generation
// Tests both GPT and fallback functionality

import { generateStoryContent, generateMockStoryContent } from '../services/storyContentGenerator.js';

async function testStoryGeneration() {
  console.log("🧪 Testing Story Content Generation");
  console.log("=====================================");
  
  const testData = {
    title: "The Great Gatsby",
    authorName: "F. Scott Fitzgerald",
    publishedYear: 1925,
    mainCategory: "book"
  };
  
  console.log("\n📝 Test Data:");
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    console.log("\n🎭 Testing main generation function...");
    const result = await generateStoryContent(testData);
    
    console.log("\n✅ Generation successful!");
    console.log("📊 Generated fields:");
    console.log("- summary:", !!result.summary);
    console.log("- description:", !!result.description);
    console.log("- characters:", result.characters?.length || 0);
    console.log("- storyrunner:", !!result.storyrunner);
    console.log("- genres:", result.genres?.length || 0);
    console.log("- tags:", result.tags?.length || 0);
    
    console.log("\n📖 Sample generated content:");
    console.log("Title:", result.summary?.original?.substring(0, 100) + "...");
    console.log("Description:", result.description?.substring(0, 150) + "...");
    console.log("Story Prompt:", result.storyrunner?.storyPrompt?.substring(0, 100) + "...");
    
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
  }
  
  try {
    console.log("\n🔄 Testing mock generation fallback...");
    const mockResult = generateMockStoryContent(testData);
    
    console.log("✅ Mock generation successful!");
    console.log("📊 Mock fields:");
    console.log("- summary:", !!mockResult.summary);
    console.log("- description:", !!mockResult.description);
    console.log("- characters:", mockResult.characters?.length || 0);
    console.log("- storyrunner:", !!mockResult.storyrunner);
    
  } catch (error) {
    console.error("❌ Mock generation failed:", error.message);
  }
  
  console.log("\n🏁 Test completed!");
}

// Run the test
testStoryGeneration().catch(console.error);