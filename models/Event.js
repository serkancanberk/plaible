import mongoose from "mongoose";

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    type: { 
      type: String, 
      required: true,
      index: true
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true,
      index: true
    },
    level: { 
      type: String, 
      enum: ["info", "warn", "error"], 
      default: "info" 
    },
    meta: { 
      type: Schema.Types.Mixed, 
      default: {} 
    },
    createdAt: { 
      type: Date, 
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false, // We're using createdAt manually
    collection: "events"
  }
);

// Compound indexes for efficient querying
eventSchema.index({ userId: 1, createdAt: -1 });
eventSchema.index({ type: 1, createdAt: -1 });

export const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
