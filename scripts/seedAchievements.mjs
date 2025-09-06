import dotenv from "dotenv"; dotenv.config();
import mongoose from "mongoose";
import { Achievement } from "../models/Achievement.js";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plaible";
await mongoose.connect(uri);

async function run() {
  const achievements = [
    {
      code: "LOYAL_HEART",
      name: "Loyal Heart",
      description: "Build deep trust with a character",
      rule: {
        kind: "relationship",
        relationship: {
          metric: "trust",
          characterId: "chr_basil",
          gte: 0.9
        }
      },
      icon: "💖",
      category: "relationship",
      enabled: true
    },
    {
      code: "FIRST_COMPLETION",
      name: "First Completion",
      description: "Complete your first story",
      rule: {
        kind: "completionCount",
        completionCount: {
          gte: 1
        }
      },
      icon: "🏆",
      category: "progress",
      enabled: true
    },
    {
      code: "DORIAN_DEEP_DIVE",
      name: "Dorian Deep Dive",
      description: "Reach chapter 5 in The Picture of Dorian Gray",
      rule: {
        kind: "progress",
        progress: {
          chapterGte: 5
        }
      },
      icon: "📖",
      category: "progress",
      enabled: true
    },
    {
      code: "SECRET_REVEALED",
      name: "Secret Revealed",
      description: "Uncover a critical story beat",
      rule: {
        kind: "criticalBeat",
        criticalBeat: {
          code: "portrait_unveiled"
        }
      },
      icon: "🔍",
      category: "story",
      enabled: true
    }
  ];

  for (const achievement of achievements) {
    await Achievement.updateOne(
      { code: achievement.code },
      { $setOnInsert: achievement },
      { upsert: true }
    );
  }

  console.log("Seeded achievements (idempotent).");
  await mongoose.disconnect();
}
await run();
