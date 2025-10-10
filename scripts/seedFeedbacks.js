import mongoose from 'mongoose';
import { Feedback } from '../models/Feedback.js';
import { User } from '../models/User.js';
import { Story } from '../models/Story.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plaible";

const seedFeedbacks = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find a story to attach feedbacks to (using Frankenstein as example)
    const story = await Story.findOne({ slug: 'the-picture-of-dorian-gray' });
    if (!story) {
      console.log("❌ No story found with slug 'the-picture-of-dorian-gray'. Please ensure the story exists.");
      return;
    }

    // Find or create test users for the feedbacks
    const testUsers = [];
    
    const userData = [
      { displayName: 'reader_028', fullName: 'Emma Thompson', email: 'reader028@example.com', location: 'London', profilePictureUrl: '/images/characters/victor.png' },
      { displayName: 'artlover_312', fullName: 'Sophie Laurent', email: 'artlover312@example.com', location: 'Paris', profilePictureUrl: '/images/characters/creature.png' },
      { displayName: 'bookwanderer', fullName: 'Alex Chen', email: 'bookwanderer@example.com', location: 'Toronto', profilePictureUrl: '/images/characters/elizabeth.png' },
      { displayName: 'gothic_scholar', fullName: 'Klaus Weber', email: 'gothic_scholar@example.com', location: 'Berlin', profilePictureUrl: '/images/characters/henry.png' }
    ];

    for (const userInfo of userData) {
      let user = await User.findOne({ displayName: userInfo.displayName });
      if (!user) {
        user = await User.create(userInfo);
      }
      testUsers.push(user);
    }

    console.log("✅ Test users created/found");

    // Long-form feedback entries for testing "Read more / Read less" functionality
    const feedbacks = [
      {
        userId: testUsers[0]._id,
        storyId: story._id.toString(),
        stars: 5,
        text: "Reading 'The Picture of Dorian Gray' through Plaible felt hauntingly personal. Taking on Dorian's role, I could almost feel the weight of his vanity pressing on my chest. The moment I decided to hide the portrait, it wasn't just a click—it was a moral collapse unfolding in slow motion. What surprised me most was how easily beauty disguised itself as purpose. This story doesn't just warn you about the price of eternal youth; it makes you experience the loneliness of perfection itself. The interactive elements forced me to confront my own vanity in ways I never expected.",
        status: "visible"
      },
      {
        userId: testUsers[1]._id,
        storyId: story._id.toString(),
        stars: 4,
        text: "I've read this novel before, but embodying Dorian Gray changed everything. The narrative hit harder when I had to choose between beauty and morality. The game's prompts forced me to think like someone who could never age, which was deeply unsettling. I ended up sympathizing with someone I once judged. The pacing of the interactive elements kept me emotionally hooked. This version of the story made vanity feel like an act of rebellion. The character development through choices was masterfully done.",
        status: "visible"
      },
      {
        userId: testUsers[2]._id,
        storyId: story._id.toString(),
        stars: 5,
        text: "Basil Hallward's perspective was so beautifully tragic in this retelling. Through the game mechanics, his voice finally felt like more than a side note to Dorian's madness. When I chose to paint his final portrait, it felt eerily intimate—like capturing someone's soul knowing it would never be the same. The emotional pacing was perfect, subtle but devastating. If you've ever felt like a quiet observer in someone else's chaos, this storyline will break you in the best way possible. The artistic elements were particularly moving.",
        status: "visible"
      },
      {
        userId: testUsers[3]._id,
        storyId: story._id.toString(),
        stars: 4,
        text: "What I loved about playing as Lord Henry Wotton is how Plaible lets you rewrite his cynicism into wisdom instead of just wit. In the original novel, he feels like a catalyst for destruction, but here you can choose how deeply he influences Dorian's choices. There's this one decision—whether to warn Dorian about the portrait's power—that completely shifted my perception of friendship. The interface's simplicity hides an emotional complexity that sneaks up on you. Absolutely brilliant storytelling design. The philosophical depth was incredible.",
        status: "visible"
      },
      {
        userId: testUsers[0]._id,
        storyId: story._id.toString(),
        stars: 5,
        text: "This second playthrough as Dorian revealed layers I missed the first time. The way the story handles the passage of time through the portrait's decay is genius. Each choice feels like it's aging the painting, and you can literally watch your soul deteriorate. The psychological horror elements are perfectly balanced with the philosophical questions. I found myself making increasingly selfish choices, and the game made me understand why. The character arc is one of the most compelling I've experienced in interactive fiction.",
        status: "visible"
      }
    ];

    // Clear existing test feedbacks for this story (optional - remove if you want to keep existing data)
    await Feedback.deleteMany({ 
      storyId: story._id.toString(),
      userId: { $in: testUsers.map(u => u._id) }
    });

    // Insert the new feedbacks
    await Feedback.insertMany(feedbacks);
    console.log("🌱 Feedback data successfully seeded!");
    console.log(`📊 Added ${feedbacks.length} long-form feedbacks for story: ${story.title}`);
    
    // Show some stats
    const totalFeedbacks = await Feedback.countDocuments({ storyId: story._id.toString() });
    console.log(`📈 Total feedbacks for this story: ${totalFeedbacks}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error seeding feedbacks:", error);
    process.exit(1);
  }
};

seedFeedbacks();
