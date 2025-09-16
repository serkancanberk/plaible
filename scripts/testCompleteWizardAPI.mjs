#!/usr/bin/env node

// Test script for complete New Story Wizard API flow
// Tests the entire flow from API generation to database storage

const API_BASE = 'http://localhost:3000/api';

async function testCompleteWizardAPI() {
  console.log("🧪 Testing Complete New Story Wizard API Flow");
  console.log("=============================================");
  
  const testData = {
    title: "The Great Gatsby",
    authorName: "F. Scott Fitzgerald",
    publishedYear: 1925,
    mainCategory: "book"
  };
  
  console.log("\n📝 Test Data:");
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    // Step 1: Test generate endpoint (preview step)
    console.log("\n🎭 Step 1: Testing generate endpoint (preview step)...");
    
    const generateResponse = await fetch(`${API_BASE}/admin/stories/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log("📊 Generate Response Status:", generateResponse.status);
    
    if (generateResponse.ok) {
      const generateResult = await generateResponse.json();
      console.log("✅ Generate successful!");
      console.log("📊 Generated document validation:");
      
      const story = generateResult.story;
      
      // Validate complete Story document structure
      const requiredFields = [
        '_id', 'slug', 'mainCategory', 'subCategory', 'title', 'authorName', 
        'publisher', 'genres', 'storySettingTime', 'publishedYear', 'headline', 
        'description', 'language', 'license', 'contentRating', 'tags', 'assets',
        'characters', 'roles', 'cast', 'hooks', 'summary', 'funFacts', 'stats',
        'share', 'feedbacks', 'pricing', 'relatedStoryIds', 'reengagementTemplates',
        'storyrunner', 'createdAt', 'updatedAt', 'isActive'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in story));
      if (missingFields.length === 0) {
        console.log("✅ All required fields present");
      } else {
        console.log("❌ Missing required fields:", missingFields);
      }
      
      // Validate specific structures
      console.log("\n🔍 Structure Validation:");
      console.log("- _id format:", story._id?.startsWith('story_') ? '✅' : '❌', story._id);
      console.log("- slug format:", story.slug?.includes('-') ? '✅' : '❌', story.slug);
      console.log("- mainCategory:", ['book', 'story', 'biography'].includes(story.mainCategory) ? '✅' : '❌', story.mainCategory);
      console.log("- subCategory:", !!story.subCategory ? '✅' : '❌', story.subCategory);
      console.log("- characters array:", Array.isArray(story.characters) ? '✅' : '❌', story.characters?.length || 0, 'characters');
      console.log("- roles array:", Array.isArray(story.roles) ? '✅' : '❌', story.roles?.length || 0, 'roles');
      console.log("- cast array:", Array.isArray(story.cast) ? '✅' : '❌', story.cast?.length || 0, 'cast entries');
      console.log("- storyrunner object:", typeof story.storyrunner === 'object' ? '✅' : '❌');
      
      // Validate role IDs
      if (story.roles && story.cast) {
        const roleIds = new Set(story.roles.map(r => r.id));
        const characterIds = new Set(story.characters?.map(c => c.id) || []);
        
        console.log("\n🎭 Role & Cast Validation:");
        console.log("- Role IDs:", roleIds.has('role_hero') && roleIds.has('role_villain') && roleIds.has('role_side') && roleIds.has('role_other') ? '✅' : '❌');
        
        let castValid = true;
        for (const castItem of story.cast) {
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
      if (story.storyrunner) {
        console.log("\n🤖 StoryRunner Validation:");
        console.log("- systemPrompt:", !!story.storyrunner.systemPrompt ? '✅' : '❌');
        console.log("- storyPrompt:", !!story.storyrunner.storyPrompt ? '✅' : '❌');
        console.log("- guardrails:", Array.isArray(story.storyrunner.guardrails) ? '✅' : '❌', story.storyrunner.guardrails?.length || 0, 'items');
        console.log("- openingBeats:", Array.isArray(story.storyrunner.openingBeats) ? '✅' : '❌', story.storyrunner.openingBeats?.length || 0, 'items');
        console.log("- editableFinalPrompt:", !!story.storyrunner.editableFinalPrompt ? '✅' : '❌');
        
        // Check storyPrompt sections
        const storyPrompt = story.storyrunner.storyPrompt || '';
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
      const hasInteractiveHeadline = story.headline?.toLowerCase().includes('step into') || 
                                    story.headline?.toLowerCase().includes('your') ||
                                    story.headline?.toLowerCase().includes('play');
      const hasInteractiveDescription = story.description?.toLowerCase().includes('step into') || 
                                       story.description?.toLowerCase().includes('choose') ||
                                       story.description?.toLowerCase().includes('you');
      
      console.log("- Interactive headline:", hasInteractiveHeadline ? '✅' : '⚠️', `"${story.headline?.substring(0, 50)}..."`);
      console.log("- Interactive description:", hasInteractiveDescription ? '✅' : '⚠️', `"${story.description?.substring(0, 50)}..."`);
      
      // Validate time setting
      console.log("\n⏰ Time Setting Validation:");
      console.log("- storySettingTime (time only):", story.storySettingTime && !story.storySettingTime.includes(',') && !story.storySettingTime.includes(' in ') ? '✅' : '❌', `"${story.storySettingTime}"`);
      
      // Step 2: Test create endpoint (save step)
      console.log("\n💾 Step 2: Testing create endpoint (save step)...");
      
      const createResponse = await fetch(`${API_BASE}/admin/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(story) // Send the complete document as-is
      });
      
      console.log("📊 Create Response Status:", createResponse.status);
      
      if (createResponse.ok) {
        const createResult = await createResponse.json();
        console.log("✅ Create successful!");
        console.log("📊 Story ID:", createResult.storyId);
        
        // Step 3: Test retrieving the created story
        console.log("\n📖 Step 3: Testing story retrieval...");
        
        const getResponse = await fetch(`${API_BASE}/admin/stories/${createResult.storyId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log("📊 Get Response Status:", getResponse.status);
        
        if (getResponse.ok) {
          const storyResult = await getResponse.json();
          console.log("✅ Story retrieval successful!");
          console.log("📊 Retrieved story validation:");
          
          const savedStory = storyResult.story;
          console.log("- title:", savedStory.title);
          console.log("- authorName:", savedStory.authorName);
          console.log("- publishedYear:", savedStory.publishedYear);
          console.log("- mainCategory:", savedStory.mainCategory);
          console.log("- subCategory:", savedStory.subCategory);
          console.log("- headline:", !!savedStory.headline);
          console.log("- description:", !!savedStory.description);
          console.log("- storySettingTime:", savedStory.storySettingTime);
          console.log("- characters:", savedStory.characters?.length || 0);
          console.log("- roles:", savedStory.roles?.length || 0);
          console.log("- cast:", savedStory.cast?.length || 0);
          console.log("- hooks:", savedStory.hooks?.length || 0);
          console.log("- storyrunner:", !!savedStory.storyrunner);
          console.log("- genres:", savedStory.genres?.length || 0);
          console.log("- tags:", savedStory.tags?.length || 0);
          console.log("- summary:", !!savedStory.summary);
          console.log("- funFacts:", !!savedStory.funFacts);
          
          // Validate that all generated content was properly saved
          console.log("\n🔍 Database Integration Validation:");
          const dbFields = ['headline', 'description', 'storySettingTime', 'subCategory', 'characters', 'roles', 'cast', 'hooks', 'storyrunner', 'genres', 'tags', 'summary', 'funFacts'];
          const missingDbFields = dbFields.filter(field => !savedStory[field]);
          
          if (missingDbFields.length === 0) {
            console.log("✅ All generated fields properly saved to database");
          } else {
            console.log("❌ Missing fields in database:", missingDbFields);
          }
          
          // Check storyrunner structure
          if (savedStory.storyrunner) {
            console.log("- storyPrompt:", !!savedStory.storyrunner.storyPrompt);
            console.log("- guardrails:", savedStory.storyrunner.guardrails?.length || 0);
            console.log("- openingBeats:", savedStory.storyrunner.openingBeats?.length || 0);
            console.log("- editableFinalPrompt:", !!savedStory.storyrunner.editableFinalPrompt);
          }
          
          console.log("\n🎉 Complete wizard flow test successful!");
          console.log("📊 Story can now be edited in the admin dashboard");
          console.log("🔗 Story ID for testing:", createResult.storyId);
          
        } else {
          const errorText = await getResponse.text();
          console.log("❌ Story retrieval failed!");
          console.log("📊 Error response:", errorText);
        }
        
      } else {
        const errorText = await createResponse.text();
        console.log("❌ Create failed!");
        console.log("📊 Error response:", errorText);
      }
      
    } else {
      const errorText = await generateResponse.text();
      console.log("❌ Generate failed!");
      console.log("📊 Error response:", errorText);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log("💡 Make sure the server is running on localhost:3000");
    }
  }
  
  console.log("\n🏁 Test completed!");
}

// Run the test
testCompleteWizardAPI().catch(console.error);
