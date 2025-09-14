import mongoose from "mongoose";

const { Schema } = mongoose;

// Brief Schema for StoryRunner AI Dashboard
const briefSchema = new Schema(
  {
    _id: { type: String, required: true, trim: true, default: "default" },
    
    // Internal reference title
    title: { 
      type: String, 
      required: true, 
      trim: true,
      default: "Default Brief"
    },
    
    // What's Plaible section
    whatIsPlaible: { 
      type: String, 
      required: true, 
      trim: true,
      default: "Plaible is an immersive AI storytelling engine."
    },
    
    // How to Play section
    howToPlay: { 
      type: String, 
      required: true, 
      trim: true,
      default: "Select a character, tone, and timeline to begin your narrative journey."
    },
    
    // Role of Storyrunner AI section
    storyrunnerRole: { 
      type: String, 
      required: true, 
      trim: true,
      default: "You are a Storyrunner AI. You'll narrate a unique journey from the eyes of the user-chosen character, set in the world of Dorian Gray. As the AI: \n- You are the narrator, world-builder, and game master.\n- Shape scenes based on character psychology, selected tone and era.\n- Begin each chapter with a dramatic opener and end with a choice.\n- Offer meaningful decisions with psychological or moral weight.\n- Tailor language, mood, and pacing to match selected settings."
    },
    
    // Metadata
    version: { type: String, default: "1.0.0" },
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now }
  },
  { 
    timestamps: true,
    collection: "briefs"
  }
);

// Index for efficient querying
briefSchema.index({ isActive: 1 });

// Static method to get default brief
briefSchema.statics.getDefaultBrief = async function() {
  const brief = await this.findOne({ _id: "default" });
  if (!brief) {
    // Create default brief if it doesn't exist
    const defaultBrief = new this();
    await defaultBrief.save();
    return defaultBrief;
  }
  return brief;
};

// Static method to update brief
briefSchema.statics.updateBrief = async function(updateData) {
  const updatedBrief = await this.findOneAndUpdate(
    { _id: "default" },
    {
      ...updateData,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
  return updatedBrief;
};

export const Brief = mongoose.models.Brief || mongoose.model("Brief", briefSchema);
