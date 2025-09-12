import mongoose from "mongoose";

const { Schema } = mongoose;

// Schema for individual tone style or time flavor
const settingOptionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    displayLabel: { type: String, required: true, trim: true },
    description: { type: String, trim: true }
  },
  { _id: false }
);

// Main StorySettings Schema
const storySettingsSchema = new Schema(
  {
    _id: { type: String, required: true, trim: true, default: "default" },
    
    // Available tone styles for storytelling
    tone_styles: {
      type: [settingOptionSchema],
      default: [
        {
          id: "original",
          displayLabel: "Original",
          description: "Stay true to the original author's tone and style"
        },
        {
          id: "drama",
          displayLabel: "Drama",
          description: "Emphasize emotional depth and character development"
        },
        {
          id: "horror",
          displayLabel: "Horror",
          description: "Add suspense, fear, and supernatural elements"
        },
        {
          id: "thriller",
          displayLabel: "Thriller",
          description: "Create tension, mystery, and fast-paced action"
        },
        {
          id: "romance",
          displayLabel: "Romance",
          description: "Focus on relationships, love, and emotional connections"
        },
        {
          id: "fantasy",
          displayLabel: "Fantasy",
          description: "Introduce magical elements and fantastical worlds"
        },
        {
          id: "sci-fi",
          displayLabel: "Sci-Fi",
          description: "Add futuristic technology and scientific concepts"
        }
      ]
    },

    // Available time flavors for storytelling
    time_flavors: {
      type: [settingOptionSchema],
      default: [
        {
          id: "original",
          displayLabel: "Original",
          description: "Keep the story in its original time period"
        },
        {
          id: "today",
          displayLabel: "Today",
          description: "Adapt the story to modern times with current technology and culture"
        },
        {
          id: "nostalgic",
          displayLabel: "Nostalgic",
          description: "Set in a romanticized past with vintage charm"
        },
        {
          id: "futuristic",
          displayLabel: "Futuristic",
          description: "Transport the story to a distant future with advanced technology"
        }
      ]
    },

    // Metadata
    version: { type: String, default: "1.0.0" },
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now }
  },
  { 
    timestamps: true,
    collection: "story_settings"
  }
);

// Index for efficient querying
storySettingsSchema.index({ isActive: 1 });

// Static method to get default settings
storySettingsSchema.statics.getDefaultSettings = async function() {
  const settings = await this.findOne({ _id: "default" });
  if (!settings) {
    // Create default settings if they don't exist
    const defaultSettings = new this();
    await defaultSettings.save();
    return defaultSettings;
  }
  return settings;
};

// Static method to get all tone styles
storySettingsSchema.statics.getToneStyles = async function() {
  const settings = await this.getDefaultSettings();
  return settings.tone_styles;
};

// Static method to get all time flavors
storySettingsSchema.statics.getTimeFlavors = async function() {
  const settings = await this.getDefaultSettings();
  return settings.time_flavors;
};

// Static method to validate tone style ID
storySettingsSchema.statics.isValidToneStyle = async function(toneStyleId) {
  const toneStyles = await this.getToneStyles();
  return toneStyles.some(style => style.id === toneStyleId);
};

// Static method to validate time flavor ID
storySettingsSchema.statics.isValidTimeFlavor = async function(timeFlavorId) {
  const timeFlavors = await this.getTimeFlavors();
  return timeFlavors.some(flavor => flavor.id === timeFlavorId);
};

export const StorySettings = mongoose.models.StorySettings || mongoose.model("StorySettings", storySettingsSchema);
