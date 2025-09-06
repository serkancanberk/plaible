import dotenv from "dotenv"; dotenv.config();
import mongoose from "mongoose";
import { ReengagementRule } from "../models/ReengagementRule.js";
import { Story } from "../models/Story.js";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plaible";
await mongoose.connect(uri);

async function run() {
  const dorian = await Story.findOne({ slug: "the-picture-of-dorian-gray" }).lean();

  const rules = [
    {
      storyId: dorian?._id,
      trigger: { type: "inactivity", hours: 48 },
      template: 'In Basil\'s voice: "{displayName}, the studio is quiet without you."',
      cooldownHours: 72, enabled: true
    },
    {
      trigger: { type: "lowCredits", lt: 100 },
      template: 'Lord Henry: "{displayName}, pleasure seldom waits. Top up and live a little."',
      cooldownHours: 72, enabled: true
    },
    {
      storyId: dorian?._id,
      trigger: { type: "progress", chapterGte: 0 }, // saved-not-started case
      template: 'A gentle nudge: "{displayName}, your saved story awaits."',
      cooldownHours: 72, enabled: true
    }
  ];

  for (const r of rules) {
    await ReengagementRule.updateOne(
      { "trigger.type": r.trigger.type, storyId: r.storyId ?? null },
      { $setOnInsert: r },
      { upsert: true }
    );
  }

  console.log("Seeded reengagement rules (idempotent).");
  await mongoose.disconnect();
}
await run();
