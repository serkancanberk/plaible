// routes/storyRunnerRoutes.js
// API routes for story runner functionality

import express from 'express';
import { UserStorySession } from '../models/UserStorySession.js';
import { Story } from '../models/Story.js';
import { StorySettings } from '../models/StorySettings.js';
import { StoryPrompt } from '../src/models/storyPromptModel.js';
import { generateStoryPrompt } from '../src/utils/generateStoryPrompt.js';
import { generateFirstChapter } from '../utils/storyEngine.js';

const router = express.Router();

/**
 * POST /api/story/start
 * Start a new story session
 */
router.post('/start', async (req, res) => {
  try {
    const { userId, storyId, toneStyleId, timeFlavorId } = req.body;

    console.log('🎭 Starting new story session:', { userId, storyId, toneStyleId, timeFlavorId });

    // 1. Validate required fields
    if (!userId || !storyId) {
      return res.status(400).json({
        success: false,
        error: 'userId and storyId are required'
      });
    }

    // 2. Validate that story exists
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // 3. Get story settings for default values
    const storySettings = await StorySettings.getDefaultSettings();
    if (!storySettings) {
      return res.status(500).json({
        success: false,
        error: 'Story settings not available'
      });
    }

    // 4. Determine tone and time flavor
    let finalToneStyleId = toneStyleId;
    let finalTimeFlavorId = timeFlavorId;

    // If not provided, use defaults or random selection
    if (!finalToneStyleId) {
      const defaultTone = story.storyrunner?.defaultToneStyle;
      if (defaultTone && await StorySettings.isValidToneStyle(defaultTone)) {
        finalToneStyleId = defaultTone;
      } else {
        // Random selection from available tone styles
        const availableTones = storySettings.tone_styles;
        if (availableTones.length > 0) {
          finalToneStyleId = availableTones[Math.floor(Math.random() * availableTones.length)].id;
        } else {
          return res.status(500).json({
            success: false,
            error: 'No tone styles available'
          });
        }
      }
    }

    if (!finalTimeFlavorId) {
      const defaultTime = story.storyrunner?.defaultTimeFlavor;
      if (defaultTime && await StorySettings.isValidTimeFlavor(defaultTime)) {
        finalTimeFlavorId = defaultTime;
      } else {
        // Random selection from available time flavors
        const availableTimes = storySettings.time_flavors;
        if (availableTimes.length > 0) {
          finalTimeFlavorId = availableTimes[Math.floor(Math.random() * availableTimes.length)].id;
        } else {
          return res.status(500).json({
            success: false,
            error: 'No time flavors available'
          });
        }
      }
    }

    // 5. Validate the selected tone and time flavor
    const isValidTone = await StorySettings.isValidToneStyle(finalToneStyleId);
    const isValidTime = await StorySettings.isValidTimeFlavor(finalTimeFlavorId);

    if (!isValidTone) {
      return res.status(400).json({
        success: false,
        error: `Invalid tone style: ${finalToneStyleId}`
      });
    }

    if (!isValidTime) {
      return res.status(400).json({
        success: false,
        error: `Invalid time flavor: ${finalTimeFlavorId}`
      });
    }

    // 6. Create a new user story session
    const newSession = new UserStorySession({
      userId: userId,
      storyId: storyId,
      toneStyleId: finalToneStyleId,
      timeFlavorId: finalTimeFlavorId,
      storyPrompt: 'Temporary prompt - will be updated', // Will be filled after generation
      status: 'active',
      currentChapter: 1,
      chaptersGenerated: 0,
      sessionStartedAt: new Date(),
      lastActivityAt: new Date()
    });

    const savedSession = await newSession.save();
    console.log(`✅ Session created with ID: ${savedSession._id}`);

    // 7. Generate system prompt
    const generatedPrompt = await generateStoryPrompt(savedSession._id.toString());
    if (!generatedPrompt) {
      // Clean up the session if prompt generation fails
      await UserStorySession.findByIdAndDelete(savedSession._id);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate system prompt'
      });
    }

    // 8. Update session with system prompt
    savedSession.storyPrompt = generatedPrompt;
    await savedSession.save();

    // 9. Save the prompt to story_prompts collection
    const storyPrompt = new StoryPrompt({
      sessionId: savedSession._id.toString(),
      userId: userId,
      storyId: storyId,
      finalPrompt: generatedPrompt
    });

    await storyPrompt.save();
    console.log('✅ System prompt saved to story_prompts collection');

    // 10. Return response
    res.status(201).json({
      success: true,
      data: {
        sessionId: savedSession._id.toString(),
        storyPrompt: generatedPrompt,
        storyId: storyId,
        toneStyleId: finalToneStyleId,
        timeFlavorId: finalTimeFlavorId,
        storyTitle: story.title,
        authorName: story.authorName,
        sessionStartedAt: savedSession.sessionStartedAt
      }
    });

  } catch (error) {
    console.error('Error starting story session:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * POST /api/story/generate-chapter
 * Generate the first chapter for a session
 */
router.post('/generate-chapter', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    console.log('🎭 Generating first chapter for session:', sessionId);

    // Generate the first chapter
    const chapterData = await generateFirstChapter(sessionId);
    
    if (!chapterData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate first chapter'
      });
    }

    res.status(201).json({
      success: true,
      data: chapterData
    });

  } catch (error) {
    console.error('Error generating first chapter:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/story/session/:sessionId
 * Get session details
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await UserStorySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Get story details
    const story = await Story.findById(session.storyId);
    
    // Get system prompt
    const storyPrompt = await StoryPrompt.findBySessionId(sessionId);

    res.json({
      success: true,
      data: {
        session: session,
        story: story,
        storyPrompt: storyPrompt?.finalPrompt || session.storyPrompt
      }
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/story/session/:sessionId/chapters
 * Get all chapters for a session
 */
router.get('/session/:sessionId/chapters', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { Chapter } = await import('../models/Chapter.js');
    const chapters = await Chapter.findBySessionId(sessionId);

    res.json({
      success: true,
      data: chapters
    });

  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * POST /api/story/continue
 * Continue story with user choice
 */
router.post('/continue', async (req, res) => {
  try {
    const { sessionId, previousChapterId, choiceIndex } = req.body;

    if (!sessionId || !previousChapterId || choiceIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, previousChapterId, and choiceIndex are required'
      });
    }

    console.log('🎭 Continuing story:', { sessionId, previousChapterId, choiceIndex });

    const { generateNextChapter } = await import('../utils/storyEngine.js');
    const chapterData = await generateNextChapter(sessionId, previousChapterId, choiceIndex);
    
    if (!chapterData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate next chapter'
      });
    }

    res.status(201).json({
      success: true,
      data: chapterData
    });

  } catch (error) {
    console.error('Error continuing story:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;
