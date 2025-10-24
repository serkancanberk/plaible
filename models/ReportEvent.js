const mongoose = require("mongoose");
const { Schema } = mongoose;

const reportEventSchema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: "Report", required: true, index: true },
  type: { type: String, enum: ["comment", "status_change", "assignment", "resolution"], required: true },
  content: { type: String, required: true, trim: true },
  createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

reportEventSchema.index({ reportId: 1, createdAt: -1 });
module.exports = mongoose.model("ReportEvent", reportEventSchema);
