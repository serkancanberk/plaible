#!/usr/bin/env node

// Test script for Plaible Story Content Compliance Checklist
// Tests that generated content meets all compliance requirements

import { generateStoryContent, generateMockStoryContent } from '../services/storyContentGenerator.js';

async function testPlaibleCompliance() {
  console.log("🧪 Testing Plaible Story Content Compliance Checklist");
  console.log("=====================================================");
  
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
    console.log("\n🎭 Testing story content generation with compliance validation...");
    const result = await generateStoryContent(testData);
    
    console.log("✅ Generation successful!");
    console.log("\n📊 Plaible Story Content Compliance Checklist Validation:");
    
    let complianceScore = 0;
    const totalChecks = 11;
    
    // ✅ Check 1: Canonical characters (real names, no placeholders)
    console.log("\n1. ✅ Canonical Characters Check:");
    const expectedCanonicalNames = ['Victor Frankenstein', 'The Creature', 'Elizabeth Lavenza', 'Captain Walton'];
    const actualNames = result.characters?.map(char => char.name) || [];
    const genericNames = ['The Hero', 'The Guide', 'The Protagonist', 'The Adversary', 'The Mentor', 'The Companion'];
    const hasGenericNames = actualNames.some(name => 
      genericNames.some(generic => name.includes(generic))
    );
    
    if (!hasGenericNames && actualNames.length >= 4) {
      console.log("✅ PASS: Canonical character names found, no placeholders");
      complianceScore++;
    } else {
      console.log("❌ FAIL: Generic character names or insufficient count");
      console.log("   Names:", actualNames);
    }
    
    // ✅ Check 2: Roles + Cast mapping (dual roles allowed)
    console.log("\n2. ✅ Roles + Cast Mapping Check:");
    const hasValidRoles = result.roles && result.roles.length === 4;
    const hasValidCast = result.cast && result.cast.length >= 4;
    const hasDualRoles = result.cast && result.cast.some(cast => cast.roleIds.length > 1);
    
    if (hasValidRoles && hasValidCast) {
      console.log("✅ PASS: Valid roles and cast mapping structure");
      console.log(`   Roles: ${result.roles.length}, Cast: ${result.cast.length}, Dual roles: ${hasDualRoles ? 'Yes' : 'No'}`);
      complianceScore++;
    } else {
      console.log("❌ FAIL: Invalid roles or cast structure");
    }
    
    // ✅ Check 3: Genres (specific, thematic)
    console.log("\n3. ✅ Genres Check:");
    const genres = result.genres || [];
    const genericGenres = ['literature', 'classic', 'fiction', 'general'];
    const hasGenericGenres = genres.some(genre => 
      genericGenres.includes(genre.toLowerCase())
    );
    const hasThematicGenres = genres.some(genre => 
      ['gothic', 'horror', 'philosophical', 'romance', 'tragedy'].includes(genre.toLowerCase())
    );
    
    if (!hasGenericGenres && hasThematicGenres) {
      console.log("✅ PASS: Thematic genres found, no generic genres");
      console.log("   Genres:", genres);
      complianceScore++;
    } else {
      console.log("❌ FAIL: Generic genres detected or no thematic genres");
      console.log("   Genres:", genres);
    }
    
    // ✅ Check 4: Tags (mood, conflict, secondary setting)
    console.log("\n4. ✅ Tags Check:");
    const tags = result.tags || [];
    const hasRichTags = tags.length >= 5;
    const hasMoodTags = tags.some(tag => 
      ['gothic', 'dark', 'mysterious', 'tragic', 'romantic'].includes(tag.toLowerCase())
    );
    
    if (hasRichTags && hasMoodTags) {
      console.log("✅ PASS: Rich thematic tags found");
      console.log("   Tags:", tags);
      complianceScore++;
    } else {
      console.log("❌ FAIL: Insufficient or non-thematic tags");
      console.log("   Tags:", tags);
    }
    
    // ✅ Check 5: StorySettingTime (precise period)
    console.log("\n5. ✅ StorySettingTime Check:");
    const storySettingTime = result.storySettingTime || '';
    const vagueSettings = ['19th century', '20th century', 'Modern era', 'Ancient times'];
    const isVague = vagueSettings.includes(storySettingTime);
    const isSpecific = storySettingTime.includes('1810s') || storySettingTime.includes('1818') || 
                      storySettingTime.includes('1890s') || storySettingTime.includes('1920s');
    
    if (!isVague && isSpecific) {
      console.log("✅ PASS: Specific historical time setting");
      console.log("   Setting:", storySettingTime);
      complianceScore++;
    } else {
      console.log("❌ FAIL: Vague time setting");
      console.log("   Setting:", storySettingTime);
    }
    
    // ✅ Check 6: Summary (original + modern + 3 highlights)
    console.log("\n6. ✅ Summary Check:");
    const hasOriginal = result.summary && result.summary.original;
    const hasModern = result.summary && result.summary.modern;
    const hasHighlights = result.summary && result.summary.highlights && result.summary.highlights.length >= 3;
    
    if (hasOriginal && hasModern && hasHighlights) {
      console.log("✅ PASS: Complete summary structure");
      console.log(`   Highlights: ${result.summary.highlights.length}`);
      complianceScore++;
    } else {
      console.log("❌ FAIL: Incomplete summary structure");
    }
    
    // ✅ Check 7: FunFacts (storyFacts, authorInfo, modernEcho)
    console.log("\n7. ✅ FunFacts Check:");
    const hasStoryFacts = result.funFacts && result.funFacts.storyFacts;
    const hasAuthorInfo = result.funFacts && result.funFacts.authorInfo;
    const hasModernEcho = result.funFacts && result.funFacts.modernEcho;
    
    if (hasStoryFacts && hasAuthorInfo && hasModernEcho) {
      console.log("✅ PASS: Complete funFacts structure");
      complianceScore++;
    } else {
      console.log("❌ FAIL: Incomplete funFacts structure");
    }
    
    // ✅ Check 8: ReengagementTemplates (minimum 2, character voices)
    console.log("\n8. ✅ ReengagementTemplates Check:");
    const hasMinTemplates = result.reengagementTemplates && result.reengagementTemplates.length >= 2;
    const hasCharacterVoices = result.reengagementTemplates && result.reengagementTemplates.some(template => 
      template.template.includes("'s voice")
    );
    
    if (hasMinTemplates && hasCharacterVoices) {
      console.log("✅ PASS: Character voice templates found");
      console.log(`   Templates: ${result.reengagementTemplates.length}`);
      complianceScore++;
    } else {
      console.log("❌ FAIL: Insufficient templates or no character voices");
    }
    
    // ✅ Check 9: StoryRunner (complete structure)
    console.log("\n9. ✅ StoryRunner Check:");
    const hasSystemPrompt = result.storyrunner && result.storyrunner.systemPrompt;
    const hasStoryPrompt = result.storyrunner && result.storyrunner.storyPrompt;
    const hasEditablePrompt = result.storyrunner && result.storyrunner.editableFinalPrompt;
    const hasGuardrails = result.storyrunner && result.storyrunner.guardrails;
    const hasOpeningBeats = result.storyrunner && result.storyrunner.openingBeats;
    
    if (hasSystemPrompt && hasStoryPrompt && hasEditablePrompt && hasGuardrails && hasOpeningBeats) {
      console.log("✅ PASS: Complete StoryRunner structure");
      complianceScore++;
    } else {
      console.log("❌ FAIL: Incomplete StoryRunner structure");
    }
    
    // ✅ Check 10: Consistency (storySettingTime matches StoryRunner Setting)
    console.log("\n10. ✅ Consistency Check:");
    const storyPromptSetting = result.storyrunner && result.storyrunner.storyPrompt ? 
      result.storyrunner.storyPrompt.match(/- \*\*Setting\*\*: (.+)/) : null;
    const isConsistent = storyPromptSetting && storyPromptSetting[1] === result.storySettingTime;
    
    if (isConsistent) {
      console.log("✅ PASS: StoryRunner Setting matches storySettingTime");
      console.log(`   Both: ${result.storySettingTime}`);
      complianceScore++;
    } else {
      console.log("❌ FAIL: StoryRunner Setting does not match storySettingTime");
      console.log(`   storySettingTime: ${result.storySettingTime}`);
      console.log(`   StoryRunner Setting: ${storyPromptSetting ? storyPromptSetting[1] : 'Not found'}`);
    }
    
    // ✅ Check 11: SubCategory in kebab-case
    console.log("\n11. ✅ SubCategory Casing Check:");
    const subCategory = result.subCategory || '';
    const isKebabCase = !subCategory.includes(' ') && !/[A-Z]/.test(subCategory);
    
    if (isKebabCase) {
      console.log("✅ PASS: SubCategory in kebab-case format");
      console.log("   SubCategory:", subCategory);
      complianceScore++;
    } else {
      console.log("❌ FAIL: SubCategory not in kebab-case format");
      console.log("   SubCategory:", subCategory);
    }
    
    // Overall assessment
    console.log("\n🎯 Plaible Story Content Compliance Assessment:");
    console.log(`📊 Compliance Score: ${complianceScore}/${totalChecks}`);
    
    if (complianceScore === totalChecks) {
      console.log("🎉 PERFECT: Meets all Plaible Story Content Compliance requirements!");
      console.log("✅ All 11 compliance checks passed");
      console.log("✅ Story is DB-ready and stylistically aligned");
      console.log("✅ No compliance issues detected");
    } else if (complianceScore >= 9) {
      console.log("✅ EXCELLENT: Meets most compliance requirements");
    } else if (complianceScore >= 7) {
      console.log("⚠️ GOOD: Meets basic compliance requirements");
    } else if (complianceScore >= 5) {
      console.log("⚠️ FAIR: Partially meets compliance requirements");
    } else {
      console.log("❌ POOR: Does not meet compliance requirements");
    }
    
    console.log("\n📖 Sample Generated Content:");
    console.log("Title:", result.title);
    console.log("Author:", result.authorName);
    console.log("SubCategory:", result.subCategory);
    console.log("Story Setting Time:", result.storySettingTime);
    console.log("Genres:", result.genres);
    console.log("Characters:", result.characters?.map(c => c.name).join(', '));
    console.log("Cast:", result.cast?.map(c => `${c.characterId} -> [${c.roleIds.join(', ')}]`).join(', '));
    
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
  }
  
  try {
    console.log("\n🔄 Testing mock generation fallback...");
    const mockResult = generateMockStoryContent(testData);
    
    console.log("✅ Mock generation successful!");
    console.log("📊 Mock Compliance Quick Check:");
    console.log("- SubCategory:", mockResult.subCategory, mockResult.subCategory.includes(' ') ? '❌' : '✅');
    console.log("- Story Setting Time:", mockResult.storySettingTime);
    console.log("- Characters:", mockResult.characters?.length, "characters");
    console.log("- Genres:", mockResult.genres);
    
    const mockScore = [
      !mockResult.subCategory.includes(' '),
      mockResult.storySettingTime.includes('1810s'),
      mockResult.characters?.length >= 4,
      mockResult.genres?.includes('gothic')
    ].filter(Boolean).length;
    
    console.log(`📊 Mock Compliance Score: ${mockScore}/4`);
    
  } catch (error) {
    console.error("❌ Mock generation failed:", error.message);
  }
  
  console.log("\n🏁 Test completed!");
}

// Run the test
testPlaibleCompliance().catch(console.error);
