import mongoose from "mongoose";

const { Schema, model } = mongoose;

const saveSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    storyId: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, trim: true },
    coverUrl: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Indexes
saveSchema.index({ userId: 1, storyId: 1 }, { unique: true });
saveSchema.index({ userId: 1, createdAt: -1 });

export const Save = mongoose.models?.Save || model("Save", saveSchema);


