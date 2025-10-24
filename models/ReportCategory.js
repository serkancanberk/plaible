import mongoose from "mongoose";
const { Schema } = mongoose;

const reportCategorySchema = new Schema({
  label: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("ReportCategory", reportCategorySchema);
