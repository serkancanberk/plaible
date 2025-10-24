import mongoose from "mongoose";

const { Schema, model } = mongoose;

const logEntrySchema = new Schema(
  {
    role: { type: String, enum: ["user", "storyrunner", "npc"], required: true },
    content: { type: String, required: true },
    choices: { type: [String], default: [] },
    chosen: { type: String },
    ts: { type: Date, default: Date.now },
  },
  { _id: false }
);

const relationshipSchema = new Schema(
  {
    characterId: { type: String, required: true },
    trust: { type: Number, required: true },
  },
  { _id: false }
);

const mirrorSchema = new Schema(
  {
    roleAlignment: { type: String },
    relationships: { type: [relationshipSchema], default: [] },
    criticalBeats: { type: [String], default: [] },
    hint: { type: String },
    progressNote: { type: String },
  },
  { _id: false }
);

const ratingSchema = new Schema(
  {
    stars: { type: Number },
    text: { type: String },
  },
  { _id: false }
);

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    storyId: { type: String, required: true },
    characterId: { type: String, required: true },
    roleIds: { type: [String], default: [] },
    settings: {
      toneStyleId: { type: String },
      timeFlavorId: { type: String },
    },
    progress: {
      chapter: { type: Number, default: 1 },
      chapterCountApprox: { type: Number, default: 10 },
      completed: { type: Boolean, default: false },
    },
    log: { type: [logEntrySchema], default: [] },
    mirror: { type: mirrorSchema, default: () => ({}) },
    finale: {
      requested: { type: Boolean, default: false },
      requestedAt: { type: Date },
    },
    rating: { type: ratingSchema },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Pre-save hook to bump updatedAt
sessionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Phase 4.C: Deep trace save hooks
sessionSchema.pre('save', function(next) {
  try {
    console.log('[PHASE4C_BE] PRE-SAVE', this.constructor.modelName, this._id?.toString?.(), this.modifiedPaths?.());
    console.log('[PHASE4D_MONGO] pre(\'save\')', this.constructor.modelName, 'id=', this._id?.toString?.(), 'changes=', this.modifiedPaths?.());
  } catch {}
  next();
});
sessionSchema.post('save', function(doc) {
  try {
    console.log('[PHASE4C_BE] POST-SAVE', this.constructor.modelName, doc?._id?.toString?.());
    console.log('[PHASE4D_MONGO] post(\'save\')', this.constructor.modelName, 'id=', doc?._id?.toString?.());
  } catch {}
});

export const Session = mongoose.models?.Session || model("Session", sessionSchema);

// Phase 4.D: Trace updateOne for Session model
try {
  const originalUpdateOne = Session.updateOne.bind(Session);
  Session.updateOne = async function(filter, update, options) {
    try { console.log('[PHASE4D_MONGO] updateOne()', 'Session', 'filter=', filter, 'update=', update); } catch {}
    const res = await originalUpdateOne(filter, update, options);
    try { console.log('[PHASE4D_MONGO] updateOne() result', res); } catch {}
    return res;
  };
} catch {}

// Ensure single ACTIVE session per (userId, storyId)
sessionSchema.index(
  { userId: 1, storyId: 1 },
  { unique: true, partialFilterExpression: { "progress.completed": false } }
);

// Listing performance
sessionSchema.index({ userId: 1, _id: -1 });
sessionSchema.index({ userId: 1, "progress.completed": 1, _id: -1 });
sessionSchema.index({ storyId: 1, "progress.completed": 1 });

// Optional: on boot, log existing indexes once (do not throw)
Session.collection.getIndexes()
  .then(ix => console.log("[sessions] indexes:", Object.keys(ix)))
  .catch(() => {});
