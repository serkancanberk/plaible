import express from "express";
import Report from "../models/Report.js";

// Public router for report submission
export const publicRouter = express.Router();

// CREATE report (public)
publicRouter.post("/", async (req, res) => {
  try {
    const { categoryId, message, createdByUserId } = req.body;
    const report = new Report({ categoryId, message, createdByUserId });
    await report.save();
    res.json({ ok: true, data: report });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Admin router for report management
export const adminRouter = express.Router();

// GET all reports (admin)
adminRouter.get("/", async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("categoryId", "label")
      .populate("createdByUserId", "displayName email")
      .sort({ createdAt: -1 });
    res.json({ ok: true, data: reports });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET single report by ID
adminRouter.get("/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("categoryId", "label description")
      .populate("createdByUserId", "displayName email");
    if (!report) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, data: report });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// UPDATE report (status, note, priority)
adminRouter.patch("/:id", async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, data: report });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});