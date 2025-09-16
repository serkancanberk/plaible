#!/usr/bin/env node

// Test script for new system prompt integration
// Tests the updated story content generator with new Plaible-specific prompt

import { generateStoryContent, generateMockStoryContent } from '../services/storyContentGenerator.js';

async function testNewSystemPrompt() {
  console.log("🧪 Testing New System Prompt Integration");
  console.log("=========================================");
  
  const testData = {
    title: "Frankenstein",
    authorName: "Mary Shelley",
    publishedYear: 1818,
    mainCategory: "book"
  };
  
  console.log("\n📝 Test Data:");
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    console.log("\n🎭 Testing main generation function with new system prompt...");
    const result = await generateStoryContent(testData);
    
    console.log("\n✅ Generation successful!");
    console.log("📊 Generated fields validation:");
    console.log("- headline:", !!result.headline, `"${result.headline?.substring(0, 50)}..."`);
    console.log("- description:", !!result.description, `"${result.description?.substring(0, 50)}..."`);
    console.log("- storySettingTime:", !!result.storySettingTime, `"${result.storySettingTime}"`);
    console.log("- subCategory:", !!result.subCategory, `"${result.subCategory}"`);
    console.log("- characters:", result.characters?.length || 0, "characters");
    console.log("- roles:", result.roles?.length || 0, "roles");
    console.log("- cast:", result.cast?.length || 0, "cast entries");
    console.log("- hooks:", result.hooks?.length || 0, "hooks");
    console.log("- storyrunner:", !!result.storyrunner);
    console.log("- genres:", result.genres?.length || 0, "genres");
    console.log("- tags:", result.tags?.length || 0, "tags");
    
    // Validate schema compliance
    console.log("\n🔍 Schema Compliance Check:");
    
    // Check required fields
    const requiredFields = ['headline', 'description', 'storySettingTime', 'genres', 'tags', 'subCategory', 'characters', 'roles', 'cast', 'hooks', 'summary', 'funFacts', 'storyrunner'];
    const missingFields = requiredFields.filter(field => !result[field]);
    
    if (missingFields.length === 0) {
      console.log("✅ All required fields present");
    } else {
      console.log("❌ Missing required fields:", missingFields);
    }
    
    // Check character structure
    if (result.characters && result.characters.length > 0) {
      const char = result.characters[0];
      const charFields = ['id', 'name', 'summary', 'hooks', 'assets'];
      const missingCharFields = charFields.filter(field => !char[field]);
      
      if (missingCharFields.length === 0) {
        console.log("✅ Character structure valid");
      } else {
        console.log("❌ Missing character fields:", missingCharFields);
      }
    }
    
    // Check storyrunner structure
    if (result.storyrunner) {
      const srFields = ['storyPrompt', 'guardrails', 'openingBeats'];
      const missingSrFields = srFields.filter(field => !result.storyrunner[field]);
      
      if (missingSrFields.length === 0) {
        console.log("✅ StoryRunner structure valid");
      } else {
        console.log("❌ Missing StoryRunner fields:", missingSrFields);
      }
    }
    
    // Check interactive focus
    console.log("\n🎮 Interactive Focus Check:");
    const interactiveKeywords = ['step into', 'choose', 'decision', 'play', 'interactive', 'your choice', 'you are'];
    const descriptionInteractive = result.description?.toLowerCase().includes('step into') || 
                                  result.description?.toLowerCase().includes('choose') ||
                                  result.description?.toLowerCase().includes('you');
    const headlineInteractive = result.headline?.toLowerCase().includes('step into') ||
                               result.headline?.toLowerCase().includes('your') ||
                               result.headline?.toLowerCase().includes('play');
    
    if (descriptionInteractive || headlineInteractive) {
      console.log("✅ Content shows interactive focus");
    } else {
      console.log("⚠️ Content may need more interactive focus");
    }
    
    console.log("\n📖 Sample generated content:");
    console.log("Headline:", result.headline);
    console.log("Description:", result.description?.substring(0, 200) + "...");
    console.log("Story Prompt:", result.storyrunner?.storyPrompt?.substring(0, 150) + "...");
    
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
  }
  
  try {
    console.log("\n🔄 Testing mock generation fallback...");
    const mockResult = generateMockStoryContent(testData);
    
    console.log("✅ Mock generation successful!");
    console.log("📊 Mock fields validation:");
    console.log("- headline:", !!mockResult.headline, `"${mockResult.headline?.substring(0, 50)}..."`);
    console.log("- description:", !!mockResult.description, `"${mockResult.description?.substring(0, 50)}..."`);
    console.log("- subCategory:", !!mockResult.subCategory, `"${mockResult.subCategory}"`);
    console.log("- characters:", mockResult.characters?.length || 0, "characters");
    console.log("- storyrunner:", !!mockResult.storyrunner);
    
  } catch (error) {
    console.error("❌ Mock generation failed:", error.message);
  }
  
  console.log("\n🏁 Test completed!");
}

// Run the test
testNewSystemPrompt().catch(console.error);
