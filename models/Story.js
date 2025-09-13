// models/Story.js
import mongoose from "mongoose";
import { MAIN_CATEGORIES, LANGUAGES, CONTENT_RATINGS, LICENSES, STORY_STATUS, AGE_GROUPS } from "../src/config/categoryEnums.js";

const { Schema, model } = mongoose;

/** tiny slug helper (no external deps) */
function toSlug(s = "") {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/['".,!?()+/]/g, "")
    .replace(/&/g, " and ")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

/** Reusable sub-schemas */
const mediaBlock = new Schema(
  {
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    ambiance: { type: [String], default: [] }, // YouTube links etc.
  },
  { _id: false }
);

const characterAssets = new Schema(
  {
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
  },
  { _id: false }
);

const characterSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    hooks: { type: [String], default: [] },
    assets: { type: characterAssets, default: () => ({}) },
  },
  { _id: false }
);

const roleSchema = new Schema(
  {
    id: { type: String, required: true, trim: true }, // e.g., role_hero
    label: { type: String, required: true, trim: true }, // "Hero"
  },
  { _id: false }
);

const castSchema = new Schema(
  {
    characterId: { type: String, required: true, trim: true },
    roleIds: { type: [String], default: [] },
  },
  { _id: false }
);

const highlightSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const summarySchema = new Schema(
  {
    original: { type: String, required: true, trim: true },
    modern: { type: String, required: true, trim: true },
    highlights: { type: [highlightSchema], default: [] },
  },
  { _id: false }
);

const factItem = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const funFactsSchema = new Schema(
  {
    storyFacts: { type: [factItem], default: [] },
    authorInfo: { type: [factItem], default: [] },
    modernEcho: { type: [factItem], default: [] },
  },
  { _id: false }
);

const shareSchema = new Schema(
  {
    link: { type: String, trim: true },
    text: { type: String, trim: true },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
  },
  { _id: false }
);

const feedbackSchema = new Schema(
  {
    profilePictureUrl: { type: String, trim: true },
    displayName: { type: String, required: true, trim: true },
    text: { type: String, trim: true, maxlength: 250 },
    stars: {
      type: Number,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: "Stars must be an integer" },
      required: true,
    },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const pricingSchema = new Schema(
  {
    creditsPerChapter: { type: Number, required: true, min: 1 },
    estimatedChapterCount: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const reengagementTemplateSchema = new Schema(
  {
    trigger: { type: String, required: true, trim: true }, // e.g. "inactivity>48h", "lowCredits<100"
    template: { type: String, required: true, trim: true },
    cooldownHours: { type: Number, default: 72, min: 0 },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const storyrunnerSchema = new Schema(
  {
    storyPrompt: { type: String, required: true, trim: true },
    systemPrompt: { type: String, trim: true }, // Legacy field for backward compatibility
    guardrails: { type: [String], default: [] },
    openingBeats: { type: [String], default: [] },
  },
  { _id: false }
);

/** Main Story Schema */
const storySchema = new Schema(
  {
    _id: { type: String, required: true, trim: true }, // prefer semantic IDs (e.g., "story_dorian_gray")
    slug: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    mainCategory: { type: String, required: true, enum: MAIN_CATEGORIES },
    subCategory: { type: String, trim: true },

    title: { type: String, required: true, trim: true },
    authorName: { type: String, trim: true },
    publisher: { type: String, trim: true },
    genres: { type: [{ type: String, trim: true }], default: [] },
    publishedEra: { type: String, trim: true },
    publishedYear: { type: Number, min: 0 },
    headline: { type: String, trim: true },
    description: { type: String, trim: true },

    language: { type: String, default: "en", enum: LANGUAGES, trim: true },
    license: { type: String, default: "public-domain", enum: LICENSES, trim: true },
    contentRating: { type: String, default: "PG-13", enum: CONTENT_RATINGS, trim: true },
    tags: { type: [{ type: String, trim: true }], default: [] },

    assets: { type: mediaBlock, default: () => ({}) },

    characters: { type: [characterSchema], default: [] },
    roles: { type: [roleSchema], default: [] },
    cast: { type: [castSchema], default: [] },

    hooks: { type: [String], default: [] },
    summary: { type: summarySchema, required: true },

    funFacts: { type: funFactsSchema, default: () => ({}) },

    stats: {
      totalPlayed: { type: Number, default: 0, min: 0 },
      totalReviews: { type: Number, default: 0, min: 0 },
      avgRating: { type: Number, default: 0, min: 0, max: 5 },
      savedCount: { type: Number, default: 0, min: 0 },
    },

    share: { type: shareSchema, default: () => ({}) },

    feedbacks: { type: [feedbackSchema], default: [] },

    pricing: { type: pricingSchema, required: true },

    relatedStoryIds: { type: [String], default: [] },

    reengagementTemplates: { type: [reengagementTemplateSchema], default: [] },

    storyrunner: { type: storyrunnerSchema, required: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/** Cast consistency check (schema-level) */
storySchema.path("cast").validate(function (cast) {
  if (!Array.isArray(cast)) return true;
  const charIds = new Set(this.characters.map(c => c.id));
  const roleIds = new Set(this.roles.map(r => r.id));
  for (const c of cast) {
    if (!charIds.has(c.characterId)) return false;
    if (!Array.isArray(c.roleIds) || c.roleIds.some(r => !roleIds.has(r))) return false;
  }
  return true;
}, "Cast mapping is invalid: unknown characterId or roleId in cast.");

/** Static validator (usable in seed scripts) */
storySchema.statics.validateCastConsistency = function (doc) {
  const charIds = new Set(doc.characters?.map(c => c.id) || []);
  const roleIds = new Set(doc.roles?.map(r => r.id) || []);
  for (const c of doc.cast || []) {
    if (!charIds.has(c.characterId)) {
      return { ok: false, reason: `Unknown characterId in cast: ${c.characterId}` };
    }
    for (const r of c.roleIds || []) {
      if (!roleIds.has(r)) {
        return { ok: false, reason: `Unknown roleId in cast: ${r}` };
      }
    }
  }
  return { ok: true };
};

/** Helpers */
storySchema.methods.addFeedback = async function ({ profilePictureUrl, displayName, text = "", stars, date = new Date() }) {
  const entry = {
    profilePictureUrl: profilePictureUrl?.trim() || "",
    displayName: displayName?.trim(),
    text: String(text || "").slice(0, 250),
    stars,
    date,
  };
  this.feedbacks.push(entry);

  // Recompute review stats
  const total = this.feedbacks.length;
  const sum = this.feedbacks.reduce((acc, f) => acc + (Number.isFinite(f.stars) ? f.stars : 0), 0);
  this.stats.totalReviews = total;
  this.stats.avgRating = total ? Math.round((sum / total) * 10) / 10 : 0;

  this.updatedAt = new Date();
  return this.save();
};

storySchema.methods.incrementPlayed = async function () {
  this.stats.totalPlayed = (this.stats.totalPlayed || 0) + 1;
  this.updatedAt = new Date();
  return this.save();
};

storySchema.methods.incrementSaved = async function () {
  this.stats.savedCount = (this.stats.savedCount || 0) + 1;
  this.updatedAt = new Date();
  return this.save();
};

/** Pre-validate to normalize slug/_id */
storySchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = toSlug(this.title);
  } else if (this.slug) {
    this.slug = toSlug(this.slug);
  }
  if (!this._id) {
    this._id = this.slug || toSlug(this.title || "");
  }
  next();
});

/** Indexes */
storySchema.index({ mainCategory: 1, subCategory: 1 });
storySchema.index({ title: "text", authorName: "text", tags: "text", genres: "text" });

export const Story = mongoose.models?.Story || model("Story", storySchema); 