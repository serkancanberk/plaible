import mongoose from "mongoose";
const { Schema } = mongoose;

const reportSchema = new Schema({
  categoryId: { type: Schema.Types.ObjectId, ref: "ReportCategory", required: true },
  message: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "low" },
  createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  adminNote: { type: String, trim: true }
}, { timestamps: true });

export default mongoose.model("Report", reportSchema);