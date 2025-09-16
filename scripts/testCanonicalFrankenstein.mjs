#!/usr/bin/env node

// Test script for canonical Frankenstein generation
// Tests that generated content uses canonical names and rich thematic content

import { generateStoryContent, generateMockStoryContent } from '../services/storyContentGenerator.js';

async function testCanonicalFrankenstein() {
  console.log("🧪 Testing Canonical Frankenstein Generation");
  console.log("=============================================");
  
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
    console.log("\n🎭 Testing story content generation with canonical names...");
    const result = await generateStoryContent(testData);
    
    console.log("✅ Generation successful!");
    console.log("\n📊 Canonical Names Validation:");
    
    // Check for canonical character names
    const expectedCanonicalNames = ['Victor Frankenstein', 'The Creature', 'Elizabeth Lavenza', 'Captain Walton'];
    const actualNames = result.characters?.map(char => char.name) || [];
    
    console.log("Expected canonical names:", expectedCanonicalNames);
    console.log("Actual character names:", actualNames);
    
    const hasCanonicalNames = expectedCanonicalNames.every(expectedName => 
      actualNames.some(actualName => actualName.includes(expectedName.split(' ')[0]))
    );
    
    if (hasCanonicalNames) {
      console.log("✅ Canonical character names found!");
    } else {
      console.log("❌ Missing canonical character names");
    }
    
    // Check for generic placeholder names (should NOT be present)
    const genericNames = ['The Hero', 'The Guide', 'The Protagonist', 'The Adversary', 'The Mentor', 'The Companion'];
    const hasGenericNames = actualNames.some(name => 
      genericNames.some(generic => name.includes(generic))
    );
    
    if (!hasGenericNames) {
      console.log("✅ No generic placeholder names found!");
    } else {
      console.log("❌ Generic placeholder names detected:", actualNames.filter(name => 
        genericNames.some(generic => name.includes(generic))
      ));
    }
    
    console.log("\n📊 Rich Thematic Content Validation:");
    
    // Check genres (should be thematic, not generic)
    const expectedGenres = ['gothic', 'horror', 'philosophical'];
    const actualGenres = result.genres || [];
    console.log("Expected genres:", expectedGenres);
    console.log("Actual genres:", actualGenres);
    
    const hasThematicGenres = expectedGenres.every(genre => 
      actualGenres.some(actualGenre => actualGenre.toLowerCase().includes(genre))
    );
    
    if (hasThematicGenres) {
      console.log("✅ Thematic genres found!");
    } else {
      console.log("❌ Generic genres detected");
    }
    
    // Check for generic genres (should NOT be present)
    const genericGenres = ['literature', 'classic', 'fiction', 'general'];
    const hasGenericGenres = actualGenres.some(genre => 
      genericGenres.includes(genre.toLowerCase())
    );
    
    if (!hasGenericGenres) {
      console.log("✅ No generic genres found!");
    } else {
      console.log("❌ Generic genres detected:", actualGenres.filter(genre => 
        genericGenres.includes(genre.toLowerCase())
      ));
    }
    
    // Check storySettingTime (should be specific, not vague)
    const storySettingTime = result.storySettingTime || '';
    console.log("\n📅 Story Setting Time:", storySettingTime);
    
    if (storySettingTime.includes('1810s') || storySettingTime.includes('1818')) {
      console.log("✅ Specific historical time setting!");
    } else if (storySettingTime === '19th century' || storySettingTime === 'Modern era') {
      console.log("❌ Vague time setting detected");
    } else {
      console.log("⚠️ Time setting:", storySettingTime);
    }
    
    // Check tags (should be rich and thematic)
    const tags = result.tags || [];
    console.log("\n🏷️ Tags:", tags);
    
    const expectedTags = ['gothic', 'horror', 'philosophical', 'science', 'creation', 'monster'];
    const hasThematicTags = expectedTags.some(tag => 
      tags.some(actualTag => actualTag.toLowerCase().includes(tag))
    );
    
    if (hasThematicTags) {
      console.log("✅ Rich thematic tags found!");
    } else {
      console.log("❌ Generic tags detected");
    }
    
    // Check summary content
    console.log("\n📖 Summary Content:");
    if (result.summary) {
      console.log("Original:", result.summary.original);
      console.log("Modern:", result.summary.modern);
      
      if (result.summary.original?.includes('Victor Frankenstein') || result.summary.original?.includes('creates life')) {
        console.log("✅ Specific original summary!");
      } else {
        console.log("❌ Generic original summary");
      }
      
      if (result.summary.modern?.includes('artificial intelligence') || result.summary.modern?.includes('genetic engineering')) {
        console.log("✅ Contemporary modern summary!");
      } else {
        console.log("❌ Generic modern summary");
      }
      
      // Check highlights
      if (result.summary.highlights && result.summary.highlights.length >= 3) {
        console.log("\nHighlights:");
        result.summary.highlights.forEach((highlight, index) => {
          console.log(`  ${index + 1}. "${highlight.title}": ${highlight.description}`);
        });
        
        const hasSpecificHighlights = result.summary.highlights.some(h => 
          h.title.includes('Creation') || h.title.includes('Monster') || h.title.includes('Pursuit')
        );
        
        if (hasSpecificHighlights) {
          console.log("✅ Specific story highlights!");
        } else {
          console.log("❌ Generic highlights");
        }
      }
    }
    
    // Check funFacts content
    console.log("\n📚 Fun Facts Content:");
    if (result.funFacts) {
      if (result.funFacts.storyFacts) {
        console.log("Story Facts:");
        result.funFacts.storyFacts.forEach((fact, index) => {
          console.log(`  ${index + 1}. "${fact.title}": ${fact.description}`);
        });
        
        const hasSpecificFacts = result.funFacts.storyFacts.some(fact => 
          fact.title.includes('Science Fiction') || fact.title.includes('Ghost Story')
        );
        
        if (hasSpecificFacts) {
          console.log("✅ Specific story facts!");
        } else {
          console.log("❌ Generic story facts");
        }
      }
      
      if (result.funFacts.authorInfo) {
        console.log("\nAuthor Info:");
        result.funFacts.authorInfo.forEach((info, index) => {
          console.log(`  ${index + 1}. "${info.title}": ${info.description}`);
        });
        
        const hasSpecificAuthorInfo = result.funFacts.authorInfo.some(info => 
          info.title.includes('Shelley') || info.title.includes('Literary Family')
        );
        
        if (hasSpecificAuthorInfo) {
          console.log("✅ Specific author information!");
        } else {
          console.log("❌ Generic author information");
        }
      }
      
      if (result.funFacts.modernEcho) {
        console.log("\nModern Echo:");
        result.funFacts.modernEcho.forEach((echo, index) => {
          console.log(`  ${index + 1}. "${echo.title}": ${echo.description}`);
        });
        
        const hasSpecificModernEcho = result.funFacts.modernEcho.some(echo => 
          echo.title.includes('AI') || echo.title.includes('Outsider')
        );
        
        if (hasSpecificModernEcho) {
          console.log("✅ Specific modern relevance!");
        } else {
          console.log("❌ Generic modern relevance");
        }
      }
    }
    
    // Check reengagement templates
    console.log("\n💬 Reengagement Templates:");
    if (result.reengagementTemplates && result.reengagementTemplates.length >= 2) {
      result.reengagementTemplates.forEach((template, index) => {
        console.log(`  ${index + 1}. Trigger: ${template.trigger}`);
        console.log(`     Template: "${template.template}"`);
      });
      
      const hasCharacterVoices = result.reengagementTemplates.some(template => 
        template.template.includes("'s voice")
      );
      
      if (hasCharacterVoices) {
        console.log("✅ Character voice templates!");
      } else {
        console.log("❌ Generic templates");
      }
    }
    
    // Overall assessment
    console.log("\n🎯 Overall Canonical Content Assessment:");
    const score = [
      hasCanonicalNames,
      !hasGenericNames,
      hasThematicGenres,
      !hasGenericGenres,
      storySettingTime.includes('1810s') || storySettingTime.includes('1818'),
      hasThematicTags,
      result.summary?.original?.includes('Victor Frankenstein') || result.summary?.original?.includes('creates life'),
      result.summary?.modern?.includes('artificial intelligence') || result.summary?.modern?.includes('genetic engineering'),
      result.funFacts?.storyFacts?.some(fact => fact.title.includes('Science Fiction')),
      result.reengagementTemplates?.some(template => template.template.includes("'s voice"))
    ].filter(Boolean).length;
    
    console.log(`📊 Canonical Content Score: ${score}/10`);
    
    if (score >= 9) {
      console.log("🎉 EXCELLENT: Meets canonical content standard!");
      console.log("✅ Canonical character names");
      console.log("✅ Rich thematic genres and tags");
      console.log("✅ Specific historical setting");
      console.log("✅ Detailed story-specific content");
      console.log("✅ Character voice templates");
    } else if (score >= 7) {
      console.log("✅ GOOD: Mostly meets canonical content standard");
    } else if (score >= 5) {
      console.log("⚠️ FAIR: Partially meets canonical content standard");
    } else {
      console.log("❌ POOR: Does not meet canonical content standard");
    }
    
    console.log("\n📖 Sample Generated Content:");
    console.log("Title:", result.title);
    console.log("Author:", result.authorName);
    console.log("Genres:", result.genres);
    console.log("Story Setting Time:", result.storySettingTime);
    console.log("Characters:", result.characters?.map(c => `${c.name} (${c.id})`).join(', '));
    console.log("Tags:", result.tags);
    
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
  }
  
  try {
    console.log("\n🔄 Testing mock generation fallback...");
    const mockResult = generateMockStoryContent(testData);
    
    console.log("✅ Mock generation successful!");
    console.log("📊 Mock Canonical Content Validation:");
    console.log("- Character names:", mockResult.characters?.map(c => c.name).join(', '));
    console.log("- Genres:", mockResult.genres);
    console.log("- Story Setting Time:", mockResult.storySettingTime);
    console.log("- Tags:", mockResult.tags);
    
    const mockScore = [
      mockResult.characters?.some(c => c.name.includes('Victor')),
      mockResult.characters?.some(c => c.name.includes('Creature')),
      mockResult.genres?.includes('gothic'),
      mockResult.genres?.includes('horror'),
      mockResult.storySettingTime?.includes('1810s'),
      mockResult.tags?.some(tag => tag.includes('gothic'))
    ].filter(Boolean).length;
    
    console.log(`📊 Mock Canonical Content Score: ${mockScore}/6`);
    
  } catch (error) {
    console.error("❌ Mock generation failed:", error.message);
  }
  
  console.log("\n🏁 Test completed!");
}

// Run the test
testCanonicalFrankenstein().catch(console.error);
