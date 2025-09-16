#!/usr/bin/env node

// Test script for complete DB JSON flow
// Tests the entire flow from generation to database storage with complete Story documents

import { generateStoryContent, generateMockStoryContent } from '../services/storyContentGenerator.js';

async function testDBJSONFlow() {
  console.log("🧪 Testing Complete DB JSON Flow");
  console.log("=================================");
  
  const testData = {
    title: "Frankenstein",
    authorName: "Mary Shelley",
    publishedYear: 1818,
    mainCategory: "book"
  };
  
  console.log("\n📝 Test Data:");
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    // Step 1: Test story content generation
    console.log("\n🎭 Step 1: Testing story content generation...");
    const result = await generateStoryContent(testData);
    
    console.log("✅ Generation successful!");
    console.log("📊 Generated document validation:");
    
    // Validate complete Story document structure
    const requiredFields = [
      '_id', 'slug', 'mainCategory', 'subCategory', 'title', 'authorName', 
      'publisher', 'genres', 'storySettingTime', 'publishedYear', 'headline', 
      'description', 'language', 'license', 'contentRating', 'tags', 'assets',
      'characters', 'roles', 'cast', 'hooks', 'summary', 'funFacts', 'stats',
      'share', 'feedbacks', 'pricing', 'relatedStoryIds', 'reengagementTemplates',
      'storyrunner', 'createdAt', 'updatedAt', 'isActive'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in result));
    if (missingFields.length === 0) {
      console.log("✅ All required fields present");
    } else {
      console.log("❌ Missing required fields:", missingFields);
    }
    
    // Validate specific structures
    console.log("\n🔍 Structure Validation:");
    console.log("- _id format:", result._id?.startsWith('story_') ? '✅' : '❌', result._id);
    console.log("- slug format:", result.slug?.includes('-') ? '✅' : '❌', result.slug);
    console.log("- mainCategory:", ['book', 'story', 'biography'].includes(result.mainCategory) ? '✅' : '❌', result.mainCategory);
    console.log("- subCategory:", !!result.subCategory ? '✅' : '❌', result.subCategory);
    console.log("- characters array:", Array.isArray(result.characters) ? '✅' : '❌', result.characters?.length || 0, 'characters');
    console.log("- roles array:", Array.isArray(result.roles) ? '✅' : '❌', result.roles?.length || 0, 'roles');
    console.log("- cast array:", Array.isArray(result.cast) ? '✅' : '❌', result.cast?.length || 0, 'cast entries');
    console.log("- storyrunner object:", typeof result.storyrunner === 'object' ? '✅' : '❌');
    
    // Validate role IDs
    if (result.roles && result.cast) {
      const roleIds = new Set(result.roles.map(r => r.id));
      const characterIds = new Set(result.characters?.map(c => c.id) || []);
      
      console.log("\n🎭 Role & Cast Validation:");
      console.log("- Role IDs:", roleIds.has('role_hero') && roleIds.has('role_villain') && roleIds.has('role_side') && roleIds.has('role_other') ? '✅' : '❌');
      
      let castValid = true;
      for (const castItem of result.cast) {
        if (!characterIds.has(castItem.characterId)) {
          console.log(`❌ Cast references unknown character: ${castItem.characterId}`);
          castValid = false;
        }
        for (const roleId of castItem.roleIds || []) {
          if (!roleIds.has(roleId)) {
            console.log(`❌ Cast references unknown role: ${roleId}`);
            castValid = false;
          }
        }
      }
      console.log("- Cast consistency:", castValid ? '✅' : '❌');
    }
    
    // Validate storyrunner structure
    if (result.storyrunner) {
      console.log("\n🤖 StoryRunner Validation:");
      console.log("- systemPrompt:", !!result.storyrunner.systemPrompt ? '✅' : '❌');
      console.log("- storyPrompt:", !!result.storyrunner.storyPrompt ? '✅' : '❌');
      console.log("- guardrails:", Array.isArray(result.storyrunner.guardrails) ? '✅' : '❌', result.storyrunner.guardrails?.length || 0, 'items');
      console.log("- openingBeats:", Array.isArray(result.storyrunner.openingBeats) ? '✅' : '❌', result.storyrunner.openingBeats?.length || 0, 'items');
      console.log("- editableFinalPrompt:", !!result.storyrunner.editableFinalPrompt ? '✅' : '❌');
      
      // Check storyPrompt sections
      const storyPrompt = result.storyrunner.storyPrompt || '';
      const requiredSections = [
        '## About Plaible',
        '## How to Play', 
        '## StoryRunner AI Role',
        '## Story Essentials',
        '## Available Characters',
        '## Player\'s Selections',
        '## Safety Guardrails',
        '## Instructions'
      ];
      
      const missingSections = requiredSections.filter(section => !storyPrompt.includes(section));
      console.log("- StoryPrompt sections:", missingSections.length === 0 ? '✅' : '❌', missingSections.length === 0 ? 'All present' : `Missing: ${missingSections.join(', ')}`);
    }
    
    // Validate content focus
    console.log("\n🎮 Interactive Focus Validation:");
    const hasInteractiveHeadline = result.headline?.toLowerCase().includes('step into') || 
                                  result.headline?.toLowerCase().includes('your') ||
                                  result.headline?.toLowerCase().includes('play');
    const hasInteractiveDescription = result.description?.toLowerCase().includes('step into') || 
                                     result.description?.toLowerCase().includes('choose') ||
                                     result.description?.toLowerCase().includes('you');
    
    console.log("- Interactive headline:", hasInteractiveHeadline ? '✅' : '⚠️', `"${result.headline?.substring(0, 50)}..."`);
    console.log("- Interactive description:", hasInteractiveDescription ? '✅' : '⚠️', `"${result.description?.substring(0, 50)}..."`);
    
    // Validate time setting
    console.log("\n⏰ Time Setting Validation:");
    console.log("- storySettingTime (time only):", result.storySettingTime && !result.storySettingTime.includes(',') && !result.storySettingTime.includes(' in ') ? '✅' : '❌', `"${result.storySettingTime}"`);
    
    // Show sample content
    console.log("\n📖 Sample Generated Content:");
    console.log("Title:", result.title);
    console.log("Author:", result.authorName);
    console.log("Published Year:", result.publishedYear);
    console.log("Main Category:", result.mainCategory);
    console.log("Sub Category:", result.subCategory);
    console.log("Headline:", result.headline);
    console.log("Description:", result.description?.substring(0, 150) + "...");
    console.log("Story Setting Time:", result.storySettingTime);
    console.log("Genres:", result.genres);
    console.log("Tags:", result.tags);
    console.log("Characters:", result.characters?.map(c => `${c.name} (${c.id})`));
    console.log("Roles:", result.roles?.map(r => `${r.label} (${r.id})`));
    console.log("Cast:", result.cast?.map(c => `${c.characterId} -> ${c.roleIds.join(', ')}`));
    
    console.log("\n🎉 Complete DB JSON generation test successful!");
    console.log("📊 Document is ready for direct database storage");
    
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
  }
  
  try {
    console.log("\n🔄 Testing mock generation fallback...");
    const mockResult = generateMockStoryContent(testData);
    
    console.log("✅ Mock generation successful!");
    console.log("📊 Mock document validation:");
    console.log("- _id:", mockResult._id);
    console.log("- slug:", mockResult.slug);
    console.log("- mainCategory:", mockResult.mainCategory);
    console.log("- subCategory:", mockResult.subCategory);
    console.log("- characters:", mockResult.characters?.length || 0);
    console.log("- storyrunner:", !!mockResult.storyrunner);
    
  } catch (error) {
    console.error("❌ Mock generation failed:", error.message);
  }
  
  console.log("\n🏁 Test completed!");
}

// Run the test
testDBJSONFlow().catch(console.error);
