import mongoose from "mongoose";

const { Schema, model } = mongoose;

const transactionSchema = new Schema(
  {
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    displayName: { type: String, required: true, unique: true },
    about: { type: String, maxlength: 200 },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    isVerified: { type: Boolean, default: false },
    timeZone: { type: String },
    location: { type: String },
    language: { type: String, default: "en" },
    walletBalance: { type: Number, default: 0 },
    transactionHistory: { type: [transactionSchema], default: [] },
    socialConnections: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const User = model("User", userSchema); 