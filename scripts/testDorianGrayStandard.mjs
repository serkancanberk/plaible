#!/usr/bin/env node

// Test script for Dorian Gray standard compliance
// Tests that generated content matches the exact structure and richness of Dorian Gray

import { generateStoryContent, generateMockStoryContent } from '../services/storyContentGenerator.js';

async function testDorianGrayStandard() {
  console.log("🧪 Testing Dorian Gray Standard Compliance");
  console.log("===========================================");
  
  const testData = {
    title: "Frankenstein",
    authorName: "Mary Shelley",
    publishedYear: 1818,
    mainCategory: "book"
  };
  
  console.log("\n📝 Test Data:");
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    // Test main generation function
    console.log("\n🎭 Testing story content generation with Dorian Gray standard...");
    const result = await generateStoryContent(testData);
    
    console.log("✅ Generation successful!");
    console.log("📊 Dorian Gray Standard Validation:");
    
    // Validate complete Story document structure (all fields from Dorian Gray)
    const dorianGrayFields = [
      '_id', 'slug', 'mainCategory', 'subCategory', 'title', 'authorName', 
      'publisher', 'genres', 'storySettingTime', 'publishedYear', 'headline', 
      'description', 'language', 'license', 'contentRating', 'tags', 'assets',
      'characters', 'roles', 'cast', 'hooks', 'summary', 'funFacts', 'stats',
      'share', 'feedbacks', 'pricing', 'relatedStoryIds', 'reengagementTemplates',
      'storyrunner', 'createdAt', 'updatedAt', 'isActive'
    ];
    
    const missingFields = dorianGrayFields.filter(field => !(field in result));
    if (missingFields.length === 0) {
      console.log("✅ All Dorian Gray fields present");
    } else {
      console.log("❌ Missing Dorian Gray fields:", missingFields);
    }
    
    // Validate character richness (should have 4 characters like Dorian Gray)
    console.log("\n🎭 Character Richness Validation:");
    console.log("- Character count:", result.characters?.length || 0, "characters");
    console.log("- Expected: 4 characters (like Dorian Gray)");
    
    if (result.characters && result.characters.length >= 4) {
      console.log("✅ Rich character structure (Dorian Gray level)");
      
      // Validate character structure
      result.characters.forEach((char, index) => {
        console.log(`  ${index + 1}. ${char.name} (${char.id})`);
        console.log(`     Summary: "${char.summary}"`);
        console.log(`     Hooks: [${char.hooks.join(', ')}]`);
        console.log(`     Assets: ${char.assets?.images?.length || 0} images, ${char.assets?.videos?.length || 0} videos`);
      });
    } else {
      console.log("❌ Insufficient character richness (should have 4+ characters)");
    }
    
    // Validate role and cast complexity
    console.log("\n🎭 Role & Cast Complexity:");
    console.log("- Roles:", result.roles?.length || 0, "roles");
    console.log("- Cast entries:", result.cast?.length || 0, "cast entries");
    
    if (result.roles && result.cast && result.roles.length === 4 && result.cast.length >= 4) {
      console.log("✅ Complex role/cast structure (Dorian Gray level)");
      
      // Check for dual roles (like Dorian being both hero and villain)
      const dualRoles = result.cast.filter(cast => cast.roleIds.length > 1);
      console.log("- Dual-role characters:", dualRoles.length, "(like Dorian Gray)");
      
      result.cast.forEach(cast => {
        const character = result.characters.find(c => c.id === cast.characterId);
        console.log(`  ${character?.name || cast.characterId}: [${cast.roleIds.join(', ')}]`);
      });
    } else {
      console.log("❌ Insufficient role/cast complexity");
    }
    
    // Validate narrative style (Dorian Gray quality)
    console.log("\n📖 Narrative Style Validation:");
    console.log("- Headline style:", result.headline?.includes('consequence') || result.headline?.includes('choice') || result.headline?.includes('weight') ? '✅' : '❌', `"${result.headline}"`);
    console.log("- Description style:", result.description?.includes('Step into') || result.description?.includes('choice') || result.description?.includes('journey') ? '✅' : '❌', `"${result.description?.substring(0, 80)}..."`);
    
    // Validate summary structure
    if (result.summary) {
      console.log("- Summary structure:");
      console.log("  - Original:", !!result.summary.original ? '✅' : '❌');
      console.log("  - Modern:", !!result.summary.modern ? '✅' : '❌');
      console.log("  - Highlights:", result.summary.highlights?.length || 0, "highlights");
      
      if (result.summary.highlights && result.summary.highlights.length >= 3) {
        console.log("✅ Rich summary highlights (Dorian Gray level)");
        result.summary.highlights.forEach((highlight, index) => {
          console.log(`  ${index + 1}. "${highlight.title}": ${highlight.description}`);
        });
      } else {
        console.log("❌ Insufficient summary highlights");
      }
    }
    
    // Validate funFacts structure
    if (result.funFacts) {
      console.log("\n📚 Fun Facts Structure:");
      console.log("- Story Facts:", result.funFacts.storyFacts?.length || 0, "facts");
      console.log("- Author Info:", result.funFacts.authorInfo?.length || 0, "facts");
      console.log("- Modern Echo:", result.funFacts.modernEcho?.length || 0, "facts");
      
      if (result.funFacts.storyFacts && result.funFacts.authorInfo && result.funFacts.modernEcho) {
        console.log("✅ Complete funFacts structure (Dorian Gray level)");
      } else {
        console.log("❌ Incomplete funFacts structure");
      }
    }
    
    // Validate reengagement templates (character voices)
    console.log("\n💬 Reengagement Templates (Character Voices):");
    if (result.reengagementTemplates && result.reengagementTemplates.length >= 2) {
      console.log("✅ Character voice templates (Dorian Gray level)");
      result.reengagementTemplates.forEach((template, index) => {
        console.log(`  ${index + 1}. Trigger: ${template.trigger}`);
        console.log(`     Template: "${template.template}"`);
        console.log(`     Character voice: ${template.template.includes("'s voice") ? '✅' : '❌'}`);
      });
    } else {
      console.log("❌ Insufficient reengagement templates");
    }
    
    // Validate storyrunner completeness
    if (result.storyrunner) {
      console.log("\n🤖 StoryRunner Completeness:");
      console.log("- systemPrompt:", !!result.storyrunner.systemPrompt ? '✅' : '❌');
      console.log("- storyPrompt:", !!result.storyrunner.storyPrompt ? '✅' : '❌');
      console.log("- guardrails:", result.storyrunner.guardrails?.length || 0, "guardrails");
      console.log("- openingBeats:", result.storyrunner.openingBeats?.length || 0, "beats");
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
      
      if (missingSections.length === 0 && result.storyrunner.guardrails?.length >= 4 && result.storyrunner.openingBeats?.length >= 3) {
        console.log("✅ Complete StoryRunner structure (Dorian Gray level)");
      } else {
        console.log("❌ Incomplete StoryRunner structure");
      }
    }
    
    // Validate assets structure
    console.log("\n🖼️ Assets Structure:");
    if (result.assets) {
      console.log("- Images:", result.assets.images?.length || 0, "images");
      console.log("- Videos:", result.assets.videos?.length || 0, "videos");
      console.log("- Ambiance:", result.assets.ambiance?.length || 0, "ambiance");
      
      if (result.assets.images && result.assets.videos && result.assets.ambiance) {
        console.log("✅ Complete assets structure (Dorian Gray level)");
      } else {
        console.log("❌ Incomplete assets structure");
      }
    }
    
    // Validate share structure
    console.log("\n🔗 Share Structure:");
    if (result.share) {
      console.log("- Link:", !!result.share.link ? '✅' : '❌');
      console.log("- Text:", !!result.share.text ? '✅' : '❌');
      console.log("- Images:", result.share.images?.length || 0, "images");
      console.log("- Videos:", result.share.videos?.length || 0, "videos");
      
      if (result.share.link && result.share.text && result.share.images) {
        console.log("✅ Complete share structure (Dorian Gray level)");
      } else {
        console.log("❌ Incomplete share structure");
      }
    }
    
    // Overall assessment
    console.log("\n🎯 Overall Dorian Gray Standard Assessment:");
    const hasRichCharacters = result.characters && result.characters.length >= 4;
    const hasComplexCast = result.cast && result.cast.length >= 4;
    const hasRichSummary = result.summary && result.summary.highlights && result.summary.highlights.length >= 3;
    const hasCharacterVoices = result.reengagementTemplates && result.reengagementTemplates.length >= 2;
    const hasCompleteStoryRunner = result.storyrunner && result.storyrunner.storyPrompt && result.storyrunner.guardrails?.length >= 4;
    const hasAllFields = missingFields.length === 0;
    
    const score = [hasRichCharacters, hasComplexCast, hasRichSummary, hasCharacterVoices, hasCompleteStoryRunner, hasAllFields].filter(Boolean).length;
    
    console.log(`📊 Dorian Gray Compliance Score: ${score}/6`);
    
    if (score >= 5) {
      console.log("🎉 EXCELLENT: Meets Dorian Gray standard!");
      console.log("✅ Rich character structure");
      console.log("✅ Complex role/cast mapping");
      console.log("✅ Scene-based summary highlights");
      console.log("✅ Character-voice reengagement templates");
      console.log("✅ Complete StoryRunner structure");
      console.log("✅ All required fields present");
    } else if (score >= 4) {
      console.log("✅ GOOD: Mostly meets Dorian Gray standard");
    } else if (score >= 3) {
      console.log("⚠️ FAIR: Partially meets Dorian Gray standard");
    } else {
      console.log("❌ POOR: Does not meet Dorian Gray standard");
    }
    
    console.log("\n📖 Sample Generated Content:");
    console.log("Title:", result.title);
    console.log("Author:", result.authorName);
    console.log("Headline:", result.headline);
    console.log("Description:", result.description?.substring(0, 150) + "...");
    console.log("Characters:", result.characters?.map(c => `${c.name} (${c.id})`).join(', '));
    console.log("Cast:", result.cast?.map(c => `${c.characterId} -> [${c.roleIds.join(', ')}]`).join(', '));
    
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
  }
  
  try {
    console.log("\n🔄 Testing mock generation fallback...");
    const mockResult = generateMockStoryContent(testData);
    
    console.log("✅ Mock generation successful!");
    console.log("📊 Mock Dorian Gray Standard Validation:");
    console.log("- Character count:", mockResult.characters?.length || 0, "characters");
    console.log("- Cast entries:", mockResult.cast?.length || 0, "cast entries");
    console.log("- Summary highlights:", mockResult.summary?.highlights?.length || 0, "highlights");
    console.log("- Reengagement templates:", mockResult.reengagementTemplates?.length || 0, "templates");
    console.log("- StoryRunner sections:", mockResult.storyrunner?.storyPrompt ? 'Complete' : 'Incomplete');
    
    const mockScore = [
      mockResult.characters?.length >= 4,
      mockResult.cast?.length >= 4,
      mockResult.summary?.highlights?.length >= 3,
      mockResult.reengagementTemplates?.length >= 2,
      !!mockResult.storyrunner?.storyPrompt
    ].filter(Boolean).length;
    
    console.log(`📊 Mock Dorian Gray Compliance Score: ${mockScore}/5`);
    
  } catch (error) {
    console.error("❌ Mock generation failed:", error.message);
  }
  
  console.log("\n🏁 Test completed!");
}

// Run the test
testDorianGrayStandard().catch(console.error);
