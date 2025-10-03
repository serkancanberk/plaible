import mongoose from 'mongoose';
import ReportCategory from '../models/ReportCategory.js';

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plaible";

// Seed data for report categories
const seedData = [
  { label: "Content Error", description: "Wrong info, broken text, scene issue", isActive: true },
  { label: "Inappropriate Content", description: "Offensive, harmful, NSFW", isActive: true },
  { label: "Technical Bug", description: "Buttons, navigation, loading errors", isActive: true },
  { label: "Account Problems", description: "Issues with login, registration, accounts", isActive: true },
  { label: "Other", description: "Anything that doesn't fit other categories", isActive: true }
];

async function seedReportCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");

    // Clear existing report categories
    console.log("Clearing existing report categories...");
    const deleteResult = await ReportCategory.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing categories`);

    // Insert new seed data
    console.log("Inserting new report categories...");
    const insertedCategories = await ReportCategory.insertMany(seedData);
    
    console.log("Successfully seeded report categories:");
    insertedCategories.forEach(category => {
      console.log(`- ${category.label} (ID: ${category._id})`);
    });

    console.log(`Total categories inserted: ${insertedCategories.length}`);
    
  } catch (error) {
    console.error("Error seeding report categories:", error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

// Run the seed function
seedReportCategories();
