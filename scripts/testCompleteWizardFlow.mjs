#!/usr/bin/env node

// Test script for complete New Story Wizard flow
// Tests the entire flow from generation to database storage

const API_BASE = 'http://localhost:3000/api';

async function testCompleteWizardFlow() {
  console.log("🧪 Testing Complete New Story Wizard Flow");
  console.log("==========================================");
  
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
      console.log("📊 Generated content validation:");
      
      const content = generateResult.generatedContent;
      console.log("- headline:", !!content.headline, `"${content.headline?.substring(0, 50)}..."`);
      console.log("- description:", !!content.description, `"${content.description?.substring(0, 50)}..."`);
      console.log("- storySettingTime:", !!content.storySettingTime, `"${content.storySettingTime}"`);
      console.log("- subCategory:", !!content.subCategory, `"${content.subCategory}"`);
      console.log("- characters:", content.characters?.length || 0, "characters");
      console.log("- roles:", content.roles?.length || 0, "roles");
      console.log("- cast:", content.cast?.length || 0, "cast entries");
      console.log("- hooks:", content.hooks?.length || 0, "hooks");
      console.log("- storyrunner:", !!content.storyrunner);
      console.log("- genres:", content.genres?.length || 0, "genres");
      console.log("- tags:", content.tags?.length || 0, "tags");
      
      // Check interactive focus
      console.log("\n🎮 Interactive Focus Validation:");
      const hasInteractiveDescription = content.description?.toLowerCase().includes('step into') || 
                                       content.description?.toLowerCase().includes('choose') ||
                                       content.description?.toLowerCase().includes('you');
      const hasInteractiveHeadline = content.headline?.toLowerCase().includes('step into') ||
                                    content.headline?.toLowerCase().includes('your') ||
                                    content.headline?.toLowerCase().includes('play');
      
      if (hasInteractiveDescription || hasInteractiveHeadline) {
        console.log("✅ Content shows interactive focus");
      } else {
        console.log("⚠️ Content may need more interactive focus");
      }
      
      // Step 2: Test create endpoint (save step)
      console.log("\n💾 Step 2: Testing create endpoint (save step)...");
      
      const createResponse = await fetch(`${API_BASE}/admin/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...testData, autoGenerate: true })
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
          
          const story = storyResult.story;
          console.log("- title:", story.title);
          console.log("- authorName:", story.authorName);
          console.log("- publishedYear:", story.publishedYear);
          console.log("- mainCategory:", story.mainCategory);
          console.log("- subCategory:", story.subCategory);
          console.log("- headline:", !!story.headline);
          console.log("- description:", !!story.description);
          console.log("- storySettingTime:", story.storySettingTime);
          console.log("- characters:", story.characters?.length || 0);
          console.log("- roles:", story.roles?.length || 0);
          console.log("- cast:", story.cast?.length || 0);
          console.log("- hooks:", story.hooks?.length || 0);
          console.log("- storyrunner:", !!story.storyrunner);
          console.log("- genres:", story.genres?.length || 0);
          console.log("- tags:", story.tags?.length || 0);
          console.log("- summary:", !!story.summary);
          console.log("- funFacts:", !!story.funFacts);
          
          // Validate that all generated content was properly saved
          console.log("\n🔍 Database Integration Validation:");
          const dbFields = ['headline', 'description', 'storySettingTime', 'subCategory', 'characters', 'roles', 'cast', 'hooks', 'storyrunner', 'genres', 'tags', 'summary', 'funFacts'];
          const missingDbFields = dbFields.filter(field => !story[field]);
          
          if (missingDbFields.length === 0) {
            console.log("✅ All generated fields properly saved to database");
          } else {
            console.log("❌ Missing fields in database:", missingDbFields);
          }
          
          // Check storyrunner structure
          if (story.storyrunner) {
            console.log("- storyPrompt:", !!story.storyrunner.storyPrompt);
            console.log("- guardrails:", story.storyrunner.guardrails?.length || 0);
            console.log("- openingBeats:", story.storyrunner.openingBeats?.length || 0);
          }
          
          console.log("\n🎉 Complete wizard flow test successful!");
          console.log("📊 Story can now be edited in the admin dashboard");
          
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
testCompleteWizardFlow().catch(console.error);
