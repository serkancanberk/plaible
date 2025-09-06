import mongoose from "mongoose";

const engagementMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  // rule linkage (for audit):
  ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "ReengagementRule", required: true },

  type: { type: String, required: true }, // copy of rule.trigger.type
  storyId: { type: String, ref: "Story", default: null },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", default: null },

  title: { type: String },
  body: { type: String },

  cta: {
    label: { type: String },
    action: { type: String, enum: ["topup", "resume", "start", "continue"], default: "resume" },
    params: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. { storySlug, sessionId }
  },

  status: { type: String, enum: ["unread", "read", "archived"], default: "unread", index: true },

  // cooldown & idempotency key; must be unique per user within a cooldown bucket
  dedupeKey: { type: String, required: true },

  createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

engagementMessageSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true });
engagementMessageSchema.index({ userId: 1, createdAt: -1 });

export const EngagementMessage = mongoose.models.EngagementMessage || mongoose.model("EngagementMessage", engagementMessageSchema);
