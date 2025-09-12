// src/models/storyPromptModel.js
// Mongoose model for storing generated AI system prompts for user story sessions

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const storyPromptSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      trim: true,
      ref: 'UserStorySession'
    },
    userId: {
      type: String,
      required: true,
      trim: true
    },
    storyId: {
      type: String,
      required: true,
      trim: true
    },
    finalPrompt: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'story_prompts'
  }
);

// Index for efficient queries
storyPromptSchema.index({ sessionId: 1 });
storyPromptSchema.index({ userId: 1, storyId: 1 });
storyPromptSchema.index({ createdAt: -1 });

// Static methods for common queries
storyPromptSchema.statics.findBySessionId = function(sessionId) {
  return this.findOne({ sessionId });
};

storyPromptSchema.statics.findByUserId = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

storyPromptSchema.statics.findByStoryId = function(storyId) {
  return this.find({ storyId }).sort({ createdAt: -1 });
};

storyPromptSchema.statics.findByUserAndStory = function(userId, storyId) {
  return this.find({ userId, storyId }).sort({ createdAt: -1 });
};

// Instance methods
storyPromptSchema.methods.isRecent = function(minutes = 60) {
  const now = new Date();
  const diffInMinutes = (now - this.createdAt) / (1000 * 60);
  return diffInMinutes <= minutes;
};

// Export the model
export const StoryPrompt = mongoose.models.StoryPrompt || model('StoryPrompt', storyPromptSchema);
