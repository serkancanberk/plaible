import mongoose from "mongoose";

const { Schema } = mongoose;

const analyticsDailySchema = new Schema(
  {
    date: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD format
    dau: { type: Number, default: 0 }, // Daily Active Users
    sessionsStarted: { type: Number, default: 0 },
    turns: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
    moderationBlocked: { type: Number, default: 0 },
    walletTopups: { type: Number, default: 0 },
    creditsPurchased: { type: Number, default: 0 }, // sum(amount) of wallet.topup
    reengagementSent: { type: Number, default: 0 },
    achievementUnlocked: { type: Number, default: 0 },
    sseConnections: { type: Number, default: 0 },
    storyBreakdown: {
      type: Map,
      of: {
        starts: { type: Number, default: 0 },
        turns: { type: Number, default: 0 },
        completions: { type: Number, default: 0 },
        avgChapterCost: { type: Number, default: 0 }
      },
      default: {}
    }
  },
  { timestamps: true }
);

// Index for efficient querying by date range
analyticsDailySchema.index({ date: 1 });

export const AnalyticsDaily = mongoose.models.AnalyticsDaily || mongoose.model("AnalyticsDaily", analyticsDailySchema);
