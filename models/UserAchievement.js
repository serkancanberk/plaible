import mongoose from "mongoose";

const userAchievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  achievementCode: { type: String, required: true, index: true },
  // provenance
  storyId: { type: String, ref: "Story", default: null },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", default: null },
  unlockedAt: { type: Date, default: Date.now, index: true },
  // idempotency
  dedupeKey: { type: String, required: true }, // `${userId}:${achievementCode}`
}, { timestamps: false });

userAchievementSchema.index({ userId: 1, achievementCode: 1 }, { unique: true });
userAchievementSchema.index({ unlockedAt: -1 });

export const UserAchievement = mongoose.models.UserAchievement || mongoose.model("UserAchievement", userAchievementSchema);
