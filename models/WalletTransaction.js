// models/WalletTransaction.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const walletTransactionSchema = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    type: { 
      type: String, 
      enum: ["credit", "debit"], 
      required: true,
      index: true 
    },
    source: { 
      type: String, 
      enum: ["admin", "purchase", "ai", "topup", "play", "refund", "adjustment"], 
      required: true,
      index: true 
    },
    amount: { 
      type: Number, 
      required: true,
      min: 0 
    },
    balanceAfter: { 
      type: Number, 
      required: true,
      min: 0 
    },
    note: { 
      type: String, 
      maxlength: 500, 
      trim: true 
    },
    metadata: {
      // Additional context for the transaction
      sessionId: { type: String },
      storyId: { type: String },
      adminUserId: { type: Schema.Types.ObjectId, ref: 'User' },
      originalTransactionId: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' }
    }
  },
  { 
    timestamps: true 
  }
);

// Compound indexes for efficient queries
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, createdAt: -1 });
walletTransactionSchema.index({ source: 1, createdAt: -1 });
walletTransactionSchema.index({ createdAt: -1 }); // For time-based analytics

// Virtual for transaction description
walletTransactionSchema.virtual('description').get(function() {
  const action = this.type === 'credit' ? 'Added' : 'Deducted';
  const sourceDesc = {
    admin: 'Admin adjustment',
    purchase: 'Purchase',
    ai: 'AI usage',
    topup: 'Top-up',
    play: 'Story play',
    refund: 'Refund',
    adjustment: 'System adjustment'
  }[this.source] || this.source;
  
  return `${action} ${this.amount} credits via ${sourceDesc}`;
});

// Ensure virtual fields are serialized
walletTransactionSchema.set('toJSON', { virtuals: true });
walletTransactionSchema.set('toObject', { virtuals: true });

// Static method to get user's transaction history
walletTransactionSchema.statics.getUserHistory = async function(userId, options = {}) {
  const { limit = 50, offset = 0, type, source, startDate, endDate } = options;
  
  const filter = { userId };
  
  if (type) filter.type = type;
  if (source) filter.source = source;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .lean();
};

// Static method to get transaction statistics
walletTransactionSchema.statics.getTransactionStats = async function(options = {}) {
  const { startDate, endDate, userId, type, source } = options;
  
  const filter = {};
  
  if (userId) filter.userId = userId;
  if (type) filter.type = type;
  if (source) filter.source = source;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  const result = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalCredits: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } },
        totalDebits: { $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0] } },
        averageAmount: { $avg: "$amount" },
        uniqueUsers: { $addToSet: "$userId" }
      }
    },
    {
      $project: {
        totalTransactions: 1,
        totalCredits: 1,
        totalDebits: 1,
        netCredits: { $subtract: ["$totalCredits", "$totalDebits"] },
        averageAmount: { $round: ["$averageAmount", 2] },
        uniqueUserCount: { $size: "$uniqueUsers" }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : {
    totalTransactions: 0,
    totalCredits: 0,
    totalDebits: 0,
    netCredits: 0,
    averageAmount: 0,
    uniqueUserCount: 0
  };
};

export const WalletTransaction = mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);