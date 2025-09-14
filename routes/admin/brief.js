// routes/admin/brief.js
// Admin API routes for Brief management

import express from 'express';
import { Brief } from '../../models/Brief.js';

const router = express.Router();

/**
 * GET /api/admin/brief
 * Get brief content
 */
router.get('/', async (req, res) => {
  try {
    const brief = await Brief.getDefaultBrief();
    if (!brief) {
      return res.status(404).json({
        ok: false,
        error: 'Brief not found'
      });
    }

    res.json({
      ok: true,
      brief: brief
    });
  } catch (error) {
    console.error('Error fetching brief:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/admin/brief
 * Update brief content
 */
router.put('/', async (req, res) => {
  try {
    const { title, whatIsPlaible, howToPlay, storyrunnerRole } = req.body;

    // Validate required fields
    if (!whatIsPlaible || typeof whatIsPlaible !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'whatIsPlaible is required and must be a string'
      });
    }

    if (!howToPlay || typeof howToPlay !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'howToPlay is required and must be a string'
      });
    }

    if (!storyrunnerRole || typeof storyrunnerRole !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'storyrunnerRole is required and must be a string'
      });
    }

    // Update brief
    const updatedBrief = await Brief.updateBrief({
      title: title || 'Default Brief',
      whatIsPlaible: whatIsPlaible.trim(),
      howToPlay: howToPlay.trim(),
      storyrunnerRole: storyrunnerRole.trim()
    });

    res.json({
      ok: true,
      brief: updatedBrief
    });
  } catch (error) {
    console.error('Error updating brief:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

export default router;
