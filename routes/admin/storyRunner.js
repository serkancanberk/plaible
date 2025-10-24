// routes/admin/storyRunner.js
// Admin API routes for StoryRunner management

import express from 'express';
import { StorySettings } from '../../models/StorySettings.js';
import { UserStorySession } from '../../models/UserStorySession.js';
import { Session } from '../../models/Session.js';
import mongoose from 'mongoose';
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

    // Build filter object targeting live Session model
    const filter = {};
    if (userId) {
      // Session.userId is ObjectId
      try {
        filter.userId = new mongoose.Types.ObjectId(String(userId));
      } catch {
        filter.userId = String(userId);
      }
    }
    if (storyId) filter.storyId = String(storyId);
    if (status === 'active') filter['progress.completed'] = false;
    if (status === 'completed') filter['progress.completed'] = true;

    // Pagination and sorting — latest first by updatedAt
    const lim = parseInt(String(limit), 10) || 10;
    const off = parseInt(String(offset), 10) || 0;

    const sessions = await Session.find(filter, { userId: 1, storyId: 1, settings: 1, progress: 1, createdAt: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .skip(off)
      .limit(lim)
      .lean();

    const totalCount = await Session.countDocuments(filter);

    console.log('[ADMIN_SESSIONS] modelSource=Session count=', sessions.length);

    // Join users for display names/emails
    const userIds = [...new Set(sessions.map(s => String(s.userId)))];
    const users = userIds.length ? await mongoose.model('User').find(
      { _id: { $in: userIds } },
      { email: 1, 'identity.displayName': 1, 'identity.firstName': 1, 'identity.lastName': 1 }
    ).lean() : [];
    // Build user map with read-only fallback for displayName
    const userMap = new Map(users.map(u => {
      let displayName = u?.identity?.displayName || '';
      const email = u?.email || '';
      if (!displayName && email) {
        try {
          const { deriveDisplayNameFromEmail } = require('../../src/services/userDisplayName.js');
          displayName = deriveDisplayNameFromEmail(email);
        } catch {}
      }
      return [String(u._id), { displayName, email }];
    }));

    const mapped = sessions.map((s) => {
      s.settings = s.settings || { toneStyleId: 'original', timeFlavorId: 'original' };
      const status = s?.progress?.completed ? 'finished' : 'active';
      const currentChapter = s?.progress?.chapter ?? 1;
      return {
        ...s,
        displayId: `sess_${String(s._id).slice(-6)}`,
        user: userMap.get(String(s.userId)) || { displayName: '', email: '' },
        status,
        currentChapter,
        sessionStartedAt: s?.createdAt,
        lastActivityAt: s?.updatedAt,
      };
    });

    console.log('[ADMIN_API] Story Settings included in admin sessions payload');
    res.json({
      ok: true,
      modelSource: 'Session',
      sessions: mapped,
      totalCount
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
