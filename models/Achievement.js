import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true }, // e.g. LOYAL_HEART
  name: { type: String, required: true }, // display name
  description: { type: String, default: "" },
  // Simple rule shape for MVP (explicit fields; no DSL parser needed):
  rule: {
    kind: { type: String, enum: ["relationship", "progress", "criticalBeat", "completionCount"], required: true },
    // relationship(kind="trust", > threshold, characterId)
    relationship: {
      metric: { type: String, enum: ["trust"], default: "trust" },
      characterId: { type: String, default: null },
      gte: { type: Number, default: null }
    },
    // progress(chapter >= n) based on Session.progress.chapter
    progress: {
      chapterGte: { type: Number, default: null }
    },
    // criticalBeat(code in session.mirror.criticalBeats)
    criticalBeat: {
      code: { type: String, default: null }
    },
    // completionCount(>= n)
    completionCount: {
      gte: { type: Number, default: null }
    }
  },
  // visual/tag info (optional for FE)
  icon: { type: String, default: null },
  category: { type: String, default: "general" },
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

achievementSchema.index({ enabled: 1, category: 1 });

export const Achievement = mongoose.models.Achievement || mongoose.model("Achievement", achievementSchema);
