import mongoose from 'mongoose';
import Report from '../models/Report.js';
import ReportCategory from '../models/ReportCategory.js';

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plaible";

// Mock report data
const mockReports = [
  {
    message: "Login button not responding on mobile devices",
    status: "open",
    priority: "high",
    adminNote: ""
  },
  {
    message: "Profile picture upload fails with 'file too large' error even for small images",
    status: "in_progress",
    priority: "medium",
    adminNote: "Investigating file size validation logic"
  },
  {
    message: "Story text appears garbled with special characters",
    status: "resolved",
    priority: "low",
    adminNote: "Fixed encoding issue in text processing"
  },
  {
    message: "Navigation menu disappears on smaller screens",
    status: "open",
    priority: "medium",
    adminNote: ""
  },
  {
    message: "Account creation fails silently - no error message shown",
    status: "closed",
    priority: "urgent",
    adminNote: "Resolved server-side validation issue"
  },
  {
    message: "Story progress not saving properly between sessions",
    status: "in_progress",
    priority: "high",
    adminNote: "Working on session persistence fix"
  },
  {
    message: "Inappropriate content in user-generated story",
    status: "resolved",
    priority: "urgent",
    adminNote: "Content removed and user warned"
  },
  {
    message: "Loading spinner never stops on dashboard page",
    status: "open",
    priority: "low",
    adminNote: ""
  },
  {
    message: "Email notifications not being sent for story updates",
    status: "in_progress",
    priority: "medium",
    adminNote: "Checking email service configuration"
  },
  {
    message: "Search functionality returns no results for valid queries",
    status: "open",
    priority: "high",
    adminNote: ""
  }
];

async function seedReports() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");

    // Clear existing reports
    console.log("Clearing existing reports...");
    const deleteResult = await Report.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing reports`);

    // Fetch all categories
    const categories = await ReportCategory.find({});
    if (categories.length === 0) {
      console.log("No report categories found. Please run 'npm run seed:categories' first.");
      return;
    }

    console.log(`Found ${categories.length} report categories`);

    // Create reports with random category assignments
    const reportsToInsert = mockReports.map(report => ({
      ...report,
      categoryId: categories[Math.floor(Math.random() * categories.length)]._id,
      createdByUserId: null // Anonymous reports
    }));

    // Insert mock reports
    console.log("Inserting mock reports...");
    const insertedReports = await Report.insertMany(reportsToInsert);
    
    console.log("Successfully seeded mock reports:");
    insertedReports.forEach((report, index) => {
      const category = categories.find(cat => cat._id.equals(report.categoryId));
      console.log(`${index + 1}. ${report.message.substring(0, 50)}... (Status: ${report.status}, Priority: ${report.priority}, Category: ${category?.label}, ID: ${report._id})`);
    });

    console.log(`Total reports inserted: ${insertedReports.length}`);
    
  } catch (error) {
    console.error("Error seeding reports:", error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

// Run the seed function
seedReports();
