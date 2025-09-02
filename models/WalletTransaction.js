import mongoose from "mongoose";

const { Schema, model } = mongoose;

const walletTxSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["topup", "deduct", "refund"], required: true },
    amount: { type: Number, required: true, min: 1, set: v => Math.trunc(v) }, // integer credits
    storyId: { type: String, default: null }, // e.g. "story_dorian_gray" or null
    chapter: { type: Number, default: null },
    note: { type: String, default: "" },
    provider: { type: String, enum: ["stripe", "iyzico", "system", ""], default: "" },
    providerRef: { type: String, default: "" },
  },
  { timestamps: true }
);

// Index for efficient user transaction history queries
walletTxSchema.index({ userId: 1, createdAt: -1 });

// Partial unique index to prevent double deduction per user/story/chapter
walletTxSchema.index(
  { userId: 1, storyId: 1, chapter: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: "deduct", chapter: { $type: "number" } } }
);

// Convenience statics
walletTxSchema.statics.createTopup = function (userId, amount, note = "", provider = "", providerRef = "") {
  return this.create({ userId, type: "topup", amount, note, provider, providerRef });
};

walletTxSchema.statics.createDeduct = function (userId, amount, storyId, chapter, note = "deduct:chapter") {
  return this.create({ userId, type: "deduct", amount, storyId, chapter, note });
};

walletTxSchema.statics.createRefund = function (userId, amount, storyId = null, note = "refund") {
  return this.create({ userId, type: "refund", amount, storyId, note });
};

export const WalletTransaction = mongoose.models?.WalletTransaction || model("WalletTransaction", walletTxSchema);
