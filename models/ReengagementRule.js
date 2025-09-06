import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
  storyId: { type: String, ref: "Story", default: null },
  characterId: { type: String, default: null },
  roleId: { type: String, default: null },

  trigger: {
    type: {
      type: String,
      enum: ["inactivity", "flag", "progress", "lowCredits"],
      required: true,
    },
    // optional knobs depending on type:
    hours: { type: Number },      // inactivity
    lt: { type: Number },          // lowCredits
    chapterGte: { type: Number },  // progress
    code: { type: String },        // flag (e.g., "criticalBeat:jealousy")
  },

  template: { type: String, required: true }, // e.g. In Basil's voice: "{displayName}, ..."
  cooldownHours: { type: Number, default: 72 },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

ruleSchema.index({ enabled: 1, "trigger.type": 1 });
ruleSchema.index({ storyId: 1, "trigger.type": 1 });

export const ReengagementRule = mongoose.models.ReengagementRule || mongoose.model("ReengagementRule", ruleSchema);
