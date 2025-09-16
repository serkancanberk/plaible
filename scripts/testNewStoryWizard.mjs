#!/usr/bin/env node

// Test script for New Story Wizard API integration
// Tests the createStoryWithGeneration endpoint

const API_BASE = 'http://localhost:3000/api';

async function testStoryGeneration() {
  console.log("🧪 Testing New Story Wizard API Integration");
  console.log("=============================================");
  
  const testData = {
    title: "The Test Story",
    authorName: "Test Author",
    publishedYear: 2023,
    mainCategory: "book",
    autoGenerate: true
  };
  
  console.log("\n📝 Test Data:");
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    console.log("\n🎭 Testing story generation endpoint...");
    
    const response = await fetch(`${API_BASE}/admin/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need proper authentication cookies
      },
      body: JSON.stringify(testData)
    });
    
    console.log("📊 Response Status:", response.status);
    console.log("📊 Response Headers:", Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log("\n✅ Story generation successful!");
      console.log("📊 Generated story ID:", result.storyId);
      console.log("📊 Full response:", JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log("\n❌ Story generation failed!");
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
testStoryGeneration().catch(console.error);
