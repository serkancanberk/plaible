import mongoose from "mongoose";

const { Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    storyId: { type: String, required: true, index: true }, // Story _id is string
    stars: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, maxlength: 1000, trim: true },
    status: { 
      type: String, 
      enum: ["visible", "hidden", "flagged", "deleted"], 
      default: "visible", 
      index: true 
    },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for efficient querying
feedbackSchema.index({ storyId: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
