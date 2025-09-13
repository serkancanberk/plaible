import mongoose from "mongoose";
import { StorySettings } from "./StorySettings.js";

const { Schema } = mongoose;

// Main UserStorySession Schema
const userStorySessionSchema = new Schema(
  {
    // User reference
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    
    // Story reference (using String ID as per Story model pattern)
    storyId: { 
      type: String, 
      required: true,
      trim: true,
      index: true
    },
    
    // Flavor selections (must match story_settings)
    toneStyleId: { 
      type: String, 
      required: true,
      trim: true,
      validate: {
        validator: async function(toneStyleId) {
          return await StorySettings.isValidToneStyle(toneStyleId);
        },
        message: 'Invalid tone style ID. Must match available tone styles in story_settings.'
      }
    },
    
    timeFlavorId: { 
      type: String, 
      required: true,
      trim: true,
      validate: {
        validator: async function(timeFlavorId) {
          return await StorySettings.isValidTimeFlavor(timeFlavorId);
        },
        message: 'Invalid time flavor ID. Must match available time flavors in story_settings.'
      }
    },
    
    // Generated system prompt for this specific flavor combination
    storyPrompt: { 
      type: String, 
      required: true,
      trim: true
    },
    
    // Session status
    status: { 
      type: String, 
      enum: ["active", "finished", "abandoned"], 
      default: "active",
      index: true
    },
    
    // Progress tracking
    currentChapter: { 
      type: Number, 
      default: 1,
      min: 1
    },
    
    chaptersGenerated: { 
      type: Number, 
      default: 0,
      min: 0
    },
    
    // Session metadata
    sessionStartedAt: { 
      type: Date, 
      default: Date.now 
    },
    
    lastActivityAt: { 
      type: Date, 
      default: Date.now 
    },
    
    // Optional: Store user's custom preferences for this session
    userPreferences: {
      type: {
        preferredPacing: { type: String, enum: ["slow", "medium", "fast"], default: "medium" },
        contentSensitivity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
        interactionStyle: { type: String, enum: ["passive", "interactive", "immersive"], default: "interactive" }
      },
      default: {}
    }
  },
  { 
    timestamps: true,
    collection: "user_story_sessions"
  }
);

// Compound indexes for efficient querying
userStorySessionSchema.index({ userId: 1, storyId: 1 });
userStorySessionSchema.index({ userId: 1, status: 1 });
userStorySessionSchema.index({ storyId: 1, status: 1 });
userStorySessionSchema.index({ toneStyleId: 1, timeFlavorId: 1 });

// Static method to validate tone and time combination
userStorySessionSchema.statics.validateFlavorCombination = async function(toneStyleId, timeFlavorId) {
  const [isValidTone, isValidTime] = await Promise.all([
    StorySettings.isValidToneStyle(toneStyleId),
    StorySettings.isValidTimeFlavor(timeFlavorId)
  ]);
  
  return {
    isValid: isValidTone && isValidTime,
    isValidTone,
    isValidTime,
    errors: [
      ...(isValidTone ? [] : [`Invalid tone style: ${toneStyleId}`]),
      ...(isValidTime ? [] : [`Invalid time flavor: ${timeFlavorId}`])
    ]
  };
};

// Static method to get active sessions for a user
userStorySessionSchema.statics.getActiveSessions = async function(userId) {
  return await this.find({ 
    userId, 
    status: "active" 
  }).populate('userId', 'displayName email');
};

// Static method to get sessions by story
userStorySessionSchema.statics.getSessionsByStory = async function(storyId, status = null) {
  const query = { storyId };
  if (status) {
    query.status = status;
  }
  
  return await this.find(query).populate('userId', 'displayName email');
};

// Static method to get flavor usage statistics
userStorySessionSchema.statics.getFlavorStats = async function() {
  const pipeline = [
    {
      $group: {
        _id: {
          toneStyleId: "$toneStyleId",
          timeFlavorId: "$timeFlavorId"
        },
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
        },
        finishedCount: {
          $sum: { $cond: [{ $eq: ["$status", "finished"] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Instance method to update last activity
userStorySessionSchema.methods.updateActivity = function() {
  this.lastActivityAt = new Date();
  return this.save();
};

// Instance method to advance to next chapter
userStorySessionSchema.methods.advanceChapter = function() {
  this.currentChapter += 1;
  this.chaptersGenerated += 1;
  this.lastActivityAt = new Date();
  return this.save();
};

// Instance method to finish session
userStorySessionSchema.methods.finishSession = function() {
  this.status = "finished";
  this.lastActivityAt = new Date();
  return this.save();
};

// Instance method to abandon session
userStorySessionSchema.methods.abandonSession = function() {
  this.status = "abandoned";
  this.lastActivityAt = new Date();
  return this.save();
};

// Pre-save middleware to update lastActivityAt
userStorySessionSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActivityAt = new Date();
  }
  next();
});

export const UserStorySession = mongoose.models.UserStorySession || mongoose.model("UserStorySession", userStorySessionSchema);
