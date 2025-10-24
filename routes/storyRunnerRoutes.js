// routes/storyRunnerRoutes.js
// API routes for story runner functionality

import express from 'express';
import { UserStorySession } from '../models/UserStorySession.js';
import { Story } from '../models/Story.js';
import { StorySettings } from '../models/StorySettings.js';
import { User } from '../models/User.js';
import { StoryPrompt } from '../src/models/storyPromptModel.js';
import { generateStoryPrompt } from '../src/utils/generateStoryPrompt.js';
import { generateFirstChapter } from '../utils/storyEngine.js';
import StoryRunnerMessage from '../models/StoryRunnerMessage.js';
import { generateStart } from '../services/llmProvider.js';

const router = express.Router();

/**
 * GET /api/story-settings
 * Get public story settings (tone styles and time flavors)
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

    // Return only public-facing data (no admin metadata)
    res.json({
      ok: true,
      settings: {
        tone_styles: settings.tone_styles || [],
        time_flavors: settings.time_flavors || []
      }
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
 * GET /api/story-settings/user
 * Get user's saved story settings preferences
 */
router.get('/user', async (req, res) => {
  try {
    // Check for authentication - this endpoint requires auth
    const token = req.cookies?.plaible_jwt;
    let userId = null;
    
    if (token) {
      try {
        const { verifyJwt } = await import('../auth/config.js');
        const decoded = verifyJwt(token);
        userId = decoded?.sub || decoded?.uid || decoded?._id;
      } catch (err) {
        console.log("JWT verification failed", err.message);
      }
    }
    
    // Development fallback
    if (!userId && (process.env.NODE_ENV === "development" || !process.env.NODE_ENV)) {
      const mongoose = (await import('mongoose')).default;
      userId = new mongoose.Types.ObjectId("64b7cafe1234567890cafe12");
    }
    
    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }

    // Check if user has saved preferences
    const hasPreferences = user.storySettings && 
      (user.storySettings.preferredToneStyle || user.storySettings.preferredTimeFlavor);

    if (!hasPreferences) {
      return res.json({
        ok: true,
        preferences: null
      });
    }

    res.json({
      ok: true,
      preferences: {
        preferredToneStyle: user.storySettings.preferredToneStyle,
        preferredTimeFlavor: user.storySettings.preferredTimeFlavor
      }
    });
  } catch (error) {
    console.error('Error fetching user story settings:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PATCH /api/story-settings/user
 * Update user's story settings preferences
 */
router.patch('/user', async (req, res) => {
  try {
    // Check for authentication - this endpoint requires auth
    const token = req.cookies?.plaible_jwt;
    let userId = null;
    
    if (token) {
      try {
        const { verifyJwt } = await import('../auth/config.js');
        const decoded = verifyJwt(token);
        userId = decoded?.sub || decoded?.uid || decoded?._id;
      } catch (err) {
        console.log("JWT verification failed", err.message);
      }
    }
    
    // Development fallback
    if (!userId && (process.env.NODE_ENV === "development" || !process.env.NODE_ENV)) {
      const mongoose = (await import('mongoose')).default;
      userId = new mongoose.Types.ObjectId("64b7cafe1234567890cafe12");
    }
    
    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    const { preferredToneStyle, preferredTimeFlavor } = req.body;

    // Validate required fields
    if (!preferredToneStyle || !preferredTimeFlavor) {
      return res.status(400).json({
        ok: false,
        error: 'preferredToneStyle and preferredTimeFlavor are required'
      });
    }

    // Get current story settings to validate against
    const storySettings = await StorySettings.getDefaultSettings();
    if (!storySettings) {
      return res.status(500).json({
        ok: false,
        error: 'Story settings not available'
      });
    }

    // Validate tone style exists
    const validToneStyle = storySettings.tone_styles.find(style => style.id === preferredToneStyle);
    if (!validToneStyle) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid tone style'
      });
    }

    // Validate time flavor exists
    const validTimeFlavor = storySettings.time_flavors.find(flavor => flavor.id === preferredTimeFlavor);
    if (!validTimeFlavor) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid time flavor'
      });
    }

    // Update user preferences
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'storySettings.preferredToneStyle': preferredToneStyle,
          'storySettings.preferredTimeFlavor': preferredTimeFlavor,
          'storySettings.lastUpdated': new Date()
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }

    res.json({
      ok: true,
      preferences: {
        preferredToneStyle: user.storySettings.preferredToneStyle,
        preferredTimeFlavor: user.storySettings.preferredTimeFlavor
      }
    });
  } catch (error) {
    console.error('Error updating user story settings:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

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

    // 2. Validate that story exists (try by ID first, then by slug)
    let story = await Story.findById(storyId);
    if (!story) {
      // Try to find by slug if not found by ID
      story = await Story.findOne({ slug: storyId });
      if (!story) {
        return res.status(404).json({
          success: false,
          error: 'Story not found'
        });
      }
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

    // 10. Generate initial assistant message
    const startTime = Date.now();
    const llmResponse = await generateStart({
      story: story,
      characterId: req.body.characterId || 'default',
      roleIds: req.body.roleIds || []
    });
    
    const latency = Date.now() - startTime;
    
    // 11. Create initial assistant message
    const initialMessage = new StoryRunnerMessage({
      sessionId: savedSession._id,
      role: 'assistant',
      content: llmResponse.text || 'Welcome to your story adventure!',
      choices: llmResponse.choices || ['Continue', 'Explore'],
      metadata: {
        chapter: 1,
        beat: 1,
        tokenUsage: {
          prompt: 0, // Will be updated when we implement token tracking
          completion: 0,
          total: 0
        },
        model: 'gpt-4o-mini',
        finishReason: 'stop',
        latency: latency
      }
    });

    const savedMessage = await initialMessage.save();
    console.log('✅ Initial message created:', savedMessage._id);

    // 12. Update session with message tracking
    await savedSession.addMessage(savedMessage._id, 0);

    // 13. Return response with first message
    res.status(201).json({
      ok: true,
      sessionId: savedSession._id.toString(),
      firstMessage: {
        id: savedMessage._id.toString(),
        role: savedMessage.role,
        content: savedMessage.content,
        choices: savedMessage.choices,
        metadata: {
          chapter: savedMessage.metadata.chapter,
          beat: savedMessage.metadata.beat
        }
      },
      story: {
        title: story.title,
        slug: story.slug,
        character: {
          id: req.body.characterId || 'default',
          name: story.characters?.find(c => c.id === req.body.characterId)?.name || 'Your Character',
          displayName: story.characters?.find(c => c.id === req.body.characterId)?.displayName || 'Your Character'
        }
      },
      settings: {
        toneStyle: finalToneStyleId,
        timeFlavor: finalTimeFlavorId
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

/**
 * POST /api/storyrunner/turn
 * Process a user turn in the story
 */
router.post('/turn', async (req, res) => {
  try {
    const { sessionId, userMessage, choiceId, clientTurnId } = req.body;

    if (!sessionId || !userMessage) {
      return res.status(400).json({
        ok: false,
        error: 'sessionId and userMessage are required'
      });
    }

    console.log('🎭 Processing turn for session:', sessionId);

    // 1. Get session and validate
    const session = await UserStorySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        ok: false,
        error: 'Session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        ok: false,
        error: 'Session is not active'
      });
    }

    // 2. Get story details
    const story = await Story.findById(session.storyId);
    if (!story) {
      return res.status(404).json({
        ok: false,
        error: 'Story not found'
      });
    }

    // 3. Save user message
    const userMessageDoc = new StoryRunnerMessage({
      sessionId: session._id,
      role: 'user',
      content: userMessage,
      metadata: {
        chapter: session.progress.currentChapter,
        beat: session.progress.currentBeat,
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
        model: 'user',
        finishReason: 'user_input',
        latency: 0
      }
    });

    const savedUserMessage = await userMessageDoc.save();
    await session.addMessage(savedUserMessage._id, 0);

    // 4. Generate assistant response
    const startTime = Date.now();
    const { generateTurn } = await import('../services/llmProvider.js');
    
    const llmResponse = await generateTurn({
      story: story,
      session: session,
      chosen: choiceId,
      freeText: userMessage
    });
    
    const latency = Date.now() - startTime;

    // 5. Save assistant message
    const assistantMessage = new StoryRunnerMessage({
      sessionId: session._id,
      role: 'assistant',
      content: llmResponse.text || 'The story continues...',
      choices: llmResponse.choices || ['Continue', 'Explore'],
      metadata: {
        chapter: session.progress.currentChapter,
        beat: session.progress.currentBeat,
        tokenUsage: {
          prompt: 0, // Will be updated when we implement token tracking
          completion: 0,
          total: 0
        },
        model: 'gpt-4o-mini',
        finishReason: 'stop',
        latency: latency
      }
    });

    const savedAssistantMessage = await assistantMessage.save();
    await session.addMessage(savedAssistantMessage._id, 0);

    // 6. Update session progress if needed
    if (choiceId) {
      await session.recordChoice(savedAssistantMessage._id, choiceId);
      await session.advanceBeat();
    }

    // 7. Return response
    res.json({
      ok: true,
      sessionId: sessionId,
      assistantMessage: {
        id: savedAssistantMessage._id.toString(),
        role: savedAssistantMessage.role,
        content: savedAssistantMessage.content,
        choices: savedAssistantMessage.choices,
        metadata: {
          chapter: savedAssistantMessage.metadata.chapter,
          beat: savedAssistantMessage.metadata.beat,
          tokenUsage: savedAssistantMessage.metadata.tokenUsage,
          latency: savedAssistantMessage.metadata.latency
        }
      },
      progress: {
        chapter: session.progress.currentChapter,
        beat: session.progress.currentBeat,
        completed: session.progress.completed
      }
    });

  } catch (error) {
    console.error('Error processing turn:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/storyrunner/session/:id/messages
 * Get all messages for a session with pagination
 */
router.get('/session/:id/messages', async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Validate session exists
    const session = await UserStorySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        ok: false,
        error: 'Session not found'
      });
    }

    // Get messages with pagination
    const messages = await StoryRunnerMessage.getMessagesForSession(
      sessionId, 
      parseInt(limit), 
      parseInt(offset)
    );

    // Get total count
    const totalCount = await StoryRunnerMessage.getMessageCount(sessionId);

    res.json({
      ok: true,
      messages: messages.map(msg => ({
        id: msg._id.toString(),
        role: msg.role,
        content: msg.content,
        choices: msg.choices,
        metadata: msg.metadata,
        createdAt: msg.createdAt
      })),
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;
