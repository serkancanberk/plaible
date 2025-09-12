// routes/admin/storyRunner.js
// Admin API routes for StoryRunner management

import express from 'express';
import { StorySettings } from '../../models/StorySettings.js';
import { UserStorySession } from '../../models/UserStorySession.js';
import { Chapter } from '../../models/Chapter.js';

const router = express.Router();

/**
 * GET /api/admin/storyrunner/settings
 * Get story settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await StorySettings.getDefaultSettings();
    if (!settings) {
      return res.status(404).json({
        ok: false,
        error: 'Story settings not found'
      });
    }

    res.json({
      ok: true,
      settings: settings
    });
  } catch (error) {
    console.error('Error fetching story settings:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/admin/storyrunner/settings
 * Update story settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { tone_styles, time_flavors, version, isActive } = req.body;

    // Validate required fields
    if (!tone_styles || !Array.isArray(tone_styles)) {
      return res.status(400).json({
        ok: false,
        error: 'tone_styles is required and must be an array'
      });
    }

    if (!time_flavors || !Array.isArray(time_flavors)) {
      return res.status(400).json({
        ok: false,
        error: 'time_flavors is required and must be an array'
      });
    }

    // Validate tone styles
    for (const style of tone_styles) {
      if (!style.id || !style.displayLabel) {
        return res.status(400).json({
          ok: false,
          error: 'Each tone style must have id and displayLabel'
        });
      }
    }

    // Validate time flavors
    for (const flavor of time_flavors) {
      if (!flavor.id || !flavor.displayLabel) {
        return res.status(400).json({
          ok: false,
          error: 'Each time flavor must have id and displayLabel'
        });
      }
    }

    // Update settings
    const updatedSettings = await StorySettings.findOneAndUpdate(
      { _id: 'default' },
      {
        tone_styles,
        time_flavors,
        version: version || '1.0.0',
        isActive: isActive !== undefined ? isActive : true,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      ok: true,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating story settings:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/storyrunner/sessions
 * Get story sessions with filtering
 */
router.get('/sessions', async (req, res) => {
  try {
    const { userId, storyId, status, limit = 10, offset = 0 } = req.query;

    // Build filter object
    const filter = {};
    if (userId) filter.userId = userId;
    if (storyId) filter.storyId = storyId;
    if (status) filter.status = status;

    // Get sessions with pagination
    const sessions = await UserStorySession.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    // Get total count
    const totalCount = await UserStorySession.countDocuments(filter);

    res.json({
      ok: true,
      sessions: sessions,
      totalCount: totalCount
    });
  } catch (error) {
    console.error('Error fetching story sessions:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/storyrunner/sessions/:id
 * Get specific story session
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await UserStorySession.findById(id);
    if (!session) {
      return res.status(404).json({
        ok: false,
        error: 'Session not found'
      });
    }

    res.json({
      ok: true,
      session: session
    });
  } catch (error) {
    console.error('Error fetching story session:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/storyrunner/sessions/:sessionId/chapters
 * Get chapters for a specific session
 */
router.get('/sessions/:sessionId/chapters', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chapters = await Chapter.findBySessionId(sessionId);
    
    res.json({
      ok: true,
      chapters: chapters
    });
  } catch (error) {
    console.error('Error fetching session chapters:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

export default router;
