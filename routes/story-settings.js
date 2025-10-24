import express from 'express';
import { StorySettings } from '../models/StorySettings.js';
import { User } from '../models/User.js';

const router = express.Router();

// authGuard is applied at mount; keep a defensive warn for missing userId
function assertUser(req, res) {
  if (!req.userId) {
    console.warn('[AUTH_MISSING] req.userId missing in story-settings route');
    return false;
  }
  return true;
}

// GET global catalog
router.get('/settings', async (req, res) => {
  try {
    const settings = await StorySettings.getDefaultSettings();
    res.json({ ok: true, settings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET user preferences
router.get('/user', async (req, res) => {
  try {
    if (!assertUser(req, res)) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    const user = await User.findById(req.userId, { storySettings: 1 }).lean();
    if (!user?.storySettings) {
      await User.findByIdAndUpdate(req.userId, {
        storySettings: {
          preferredToneStyle: 'original',
          preferredTimeFlavor: 'original',
          lastUpdated: new Date()
        }
      });
      console.log('[USER_SETTINGS_BACKFILL] Defaults assigned on first GET for', req.userId);
      return res.json({ ok: true, preferences: { preferredToneStyle: 'original', preferredTimeFlavor: 'original' } });
    }
    res.json({ ok: true, preferences: user.storySettings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PATCH user preferences
router.patch('/user', async (req, res) => {
  try {
    if (!assertUser(req, res)) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    console.log('[PHASE4B_BE] ---- ENTER PATCH /story-settings/user ----');
    console.log('[PHASE4B_BE] req.userId:', req.userId);
    console.log('[PHASE4B_BE] req.body:', req.body);
    const { preferredToneStyle, preferredTimeFlavor } = req.body || {};
    const validTone = await StorySettings.isValidToneStyle(preferredToneStyle);
    const validTime = await StorySettings.isValidTimeFlavor(preferredTimeFlavor);
    console.log('[PHASE4B_BE] validation results:', { validTone, validTime });

    const result = await User.updateOne(
      { _id: req.userId },
      {
        $set: {
          'storySettings.preferredToneStyle': preferredToneStyle,
          'storySettings.preferredTimeFlavor': preferredTimeFlavor,
          'storySettings.lastUpdated': new Date(),
        },
      }
    );
    console.log('[PHASE4B_BE] Mongo write result:', result);

    const updatedUser = await User.findById(req.userId).select('storySettings');
    console.log('[PHASE4B_BE] Updated storySettings in DB:', updatedUser?.storySettings);
    console.log('[USER_SETTINGS_UPDATE]', req.userId, preferredToneStyle, preferredTimeFlavor);
    console.log('[PHASE5C_BE] Returning ok:true with preferences:', updatedUser?.storySettings);
    res.json({ ok: true, preferences: updatedUser?.storySettings || { preferredToneStyle, preferredTimeFlavor } });
    console.log('[PHASE4B_BE] ---- EXIT PATCH /story-settings/user ----');
  } catch (err) {
    console.error('[PHASE4B_BE] Error in PATCH /story-settings/user:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;


