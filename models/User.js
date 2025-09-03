import mongoose from "mongoose";

const { Schema, model } = mongoose;

const transactionSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["credit", "debit"], required: true },
    source: { type: String, enum: ["topup", "play", "refund", "adjustment"], default: "play" },
    note: { type: String, maxlength: 200, trim: true },
    balanceAfter: { type: Number },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    googleId: { type: String, index: true, sparse: true },
    profilePictureUrl: { type: String, trim: true },
    identity: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      displayName: { type: String, trim: true },
    },
    fullName: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, unique: true, lowercase: true, trim: true },
    about: { type: String, maxlength: 200, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phoneNumber: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    timeZone: { type: String, trim: true },
    location: { type: String, trim: true },
    language: { type: String, default: "en", trim: true },
    walletBalance: { type: Number, default: 0 },
    transactionHistory: { type: [transactionSchema], default: [] },
    socialConnections: { type: [String], default: [] },
  },
  { timestamps: true }
);

userSchema.methods.applyTransaction = async function ({ amount, type = "debit", source = "play", note = "" } = {}) {
  if (typeof amount !== "number" || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  const delta = type === "credit" ? amount : -amount;
  const nextBalance = (this.walletBalance || 0) + delta;
  if (nextBalance < 0) {
    throw new Error("Insufficient balance");
  }
  this.walletBalance = nextBalance;
  this.transactionHistory.push({
    amount,
    type,
    source,
    note,
    balanceAfter: nextBalance,
    date: new Date(),
  });
  return this.save();
};

export const User = model("User", userSchema); 