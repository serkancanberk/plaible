#!/usr/bin/env node

// Test script for New Story Wizard complete flow
// Tests both generate and create endpoints

const API_BASE = 'http://localhost:3000/api';

async function testWizardFlow() {
  console.log("🧪 Testing New Story Wizard Complete Flow");
  console.log("==========================================");
  
  const testData = {
    title: "The Wizard Test Story",
    authorName: "Test Author",
    publishedYear: 2023,
    mainCategory: "book"
  };
  
  console.log("\n📝 Test Data:");
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    // Step 1: Test generate endpoint (preview)
    console.log("\n🎭 Step 1: Testing generate endpoint (preview)...");
    
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
      console.log("📊 Generated fields:");
      console.log("- summary:", !!generateResult.generatedContent?.summary);
      console.log("- description:", !!generateResult.generatedContent?.description);
      console.log("- characters:", generateResult.generatedContent?.characters?.length || 0);
      console.log("- storyrunner:", !!generateResult.generatedContent?.storyrunner);
      console.log("- genres:", generateResult.generatedContent?.genres?.length || 0);
      console.log("- tags:", generateResult.generatedContent?.tags?.length || 0);
      
      // Step 2: Test create endpoint (save)
      console.log("\n💾 Step 2: Testing create endpoint (save)...");
      
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
        console.log("📊 Full response:", JSON.stringify(createResult, null, 2));
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
testWizardFlow().catch(console.error);
