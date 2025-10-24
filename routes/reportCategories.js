import express from "express";
import ReportCategory from "../models/ReportCategory.js";
import adminGuard from "../middleware/adminGuard.js";

const router = express.Router();

// GET all categories
router.get("/", adminGuard, async (req, res) => {
  try {
    const categories = await ReportCategory.find().sort({ order: 1 });
    res.json({ ok: true, data: categories });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// CREATE category
router.post("/", adminGuard, async (req, res) => {
  try {
    const { label, description, isActive } = req.body;
    const category = new ReportCategory({ label, description, isActive });
    await category.save();
    res.json({ ok: true, data: category });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// UPDATE category
router.patch("/:id", adminGuard, async (req, res) => {
  try {
    const category = await ReportCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, data: category });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// DELETE category
router.delete("/:id", adminGuard, async (req, res) => {
  try {
    await ReportCategory.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

export default router;
