import mongoose from "mongoose";

const { Schema, model } = mongoose;

const storyRunnerMessageSchema = new Schema({
  sessionId: { 
    type: Schema.Types.ObjectId, 
    ref: "UserStorySession", 
    required: true, 
    index: true 
  },
  role: { 
    type: String, 
    enum: ["system", "assistant", "user"], 
    required: true 
  },
  content: { 
    type: String, 
    required: true, 
    trim: true 
  },
  choices: [
    {
      text: String,
      choiceId: String,
      nextMessageId: { 
        type: Schema.Types.ObjectId, 
        ref: "StoryRunnerMessage" 
      },
    },
  ],
  metadata: {
    chapter: Number,
    beat: Number,
    tokenUsage: {
      prompt: Number,
      completion: Number,
      total: Number,
    },
    model: String,
    finishReason: String,
    latency: Number,
  },
}, { 
  timestamps: true,
  collection: "storyrunner_messages"
});

// Indexes for efficient querying
storyRunnerMessageSchema.index({ sessionId: 1, createdAt: 1 });
storyRunnerMessageSchema.index({ sessionId: 1, role: 1 });

// Static method to get messages for a session with pagination
storyRunnerMessageSchema.statics.getMessagesForSession = function(sessionId, limit = 50, offset = 0) {
  return this.find({ sessionId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .skip(offset)
    .lean();
};

// Static method to get message count for a session
storyRunnerMessageSchema.statics.getMessageCount = function(sessionId) {
  return this.countDocuments({ sessionId });
};

// Static method to get latest message for a session
storyRunnerMessageSchema.statics.getLatestMessage = function(sessionId) {
  return this.findOne({ sessionId })
    .sort({ createdAt: -1 })
    .lean();
};

// Instance method to calculate total tokens for this message
storyRunnerMessageSchema.methods.getTotalTokens = function() {
  if (this.metadata?.tokenUsage?.total) {
    return this.metadata.tokenUsage.total;
  }
  if (this.metadata?.tokenUsage?.prompt && this.metadata?.tokenUsage?.completion) {
    return this.metadata.tokenUsage.prompt + this.metadata.tokenUsage.completion;
  }
  return 0;
};

export default model("StoryRunnerMessage", storyRunnerMessageSchema);
