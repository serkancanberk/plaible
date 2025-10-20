import mongoose from 'mongoose';
import { Story } from '../models/Story.js';
import { Save } from '../models/Save.js';
import { User } from '../models/User.js';
import { logContentEvent, eventTypes } from '../services/eventLog.js';

// MongoDB connection detection
let isReplicaSet = null;
let connectionCheckPromise = null;

const checkMongoDBConnection = async () => {
  if (connectionCheckPromise) {
    return connectionCheckPromise;
  }

  connectionCheckPromise = (async () => {
    try {
      const admin = mongoose.connection.db.admin();
      const serverStatus = await admin.serverStatus();
      
      // Check if running in replica set mode
      const isReplSet = serverStatus.repl && serverStatus.repl.setName;
      isReplicaSet = isReplSet;
      
      if (!isReplSet) {
        console.warn('[saveController] MongoDB running in standalone mode - transactions disabled');
        console.warn('[saveController] For full transaction support, configure MongoDB as a replica set');
      } else {
        console.log('[saveController] MongoDB replica set detected - full transaction support enabled');
      }
      
      return isReplSet;
    } catch (error) {
      console.warn('[saveController] Could not detect MongoDB connection type:', error.message);
      // Default to non-transactional for safety
      isReplicaSet = false;
      return false;
    }
  })();

  return connectionCheckPromise;
};

// Standardized response helpers
const successResponse = (res, data = {}) => res.json({ success: true, data });
const errorResponse = (res, message, code = 'SERVER_ERROR', statusCode = 500) => 
  res.status(statusCode).json({ success: false, message, code });

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3;

const checkRateLimit = (userId) => {
  const now = Date.now();
  const userKey = `user_${userId}`;
  const userRequests = rateLimitStore.get(userKey) || [];
  
  // Remove old requests outside the window
  const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitStore.set(userKey, validRequests);
  return true;
};

// Helper function to get saved stories (works with or without transactions)
const getSavedStoriesData = async (userId, session = null) => {
  const query = Save.find({ userId }, { slug: 1, title: 1, coverUrl: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();

  if (session) {
    query.session(session);
  }

  const savedStories = await query;
  
  return savedStories.map(story => ({
    slug: story.slug,
    title: story.title || '',
    coverImage: story.coverUrl || '',
    savedAt: story.createdAt.toISOString(),
    createdAt: story.createdAt.toISOString()
  }));
};

// Non-transactional save operation
const saveStoryNonTransactional = async (userId, storySlug, story, coverUrl) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  console.log('[DB_WRITE]', { userId, asObjectId: userObjectId.toString() });
  // Check if already saved
  const existingSave = await Save.findOne({ userId: userObjectId, storyId: story._id }).lean();
  if (existingSave) {
    return { alreadySaved: true };
  }

  // Create new save
  const newSave = new Save({
    userId: userObjectId,
    storyId: story._id,
    slug: story.slug.toLowerCase(),
    title: story.title,
    coverUrl,
    createdAt: new Date()
  });

  await newSave.save();

  // Update User model savedStories array
  const userUpdAdd = await User.updateOne(
    { _id: userObjectId },
    { 
      $addToSet: {
        savedStories: {
          slug: story.slug.toLowerCase(),
          savedAt: new Date(),
          title: story.title,
          coverImage: coverUrl
        }
      }
    }
  );
  console.log('[DB_RESULT]', userUpdAdd);
  console.log('[SAVE_WRITE]', { userId: String(userId), matchedCount: userUpdAdd.matchedCount, modifiedCount: userUpdAdd.modifiedCount });

  // Increment story save count
  await Story.updateOne(
    { _id: story._id },
    { $inc: { 'stats.savedCount': 1 } }
  );

  return { saved: true };
};

// Non-transactional unsave operation
const unsaveStoryNonTransactional = async (userId, slug) => {
  // Find the save to get storyId
  const saveDoc = await Save.findOne({ userId, slug: slug.toLowerCase() }, { storyId: 1 }).lean();
  if (!saveDoc) {
    return { notFound: true };
  }

  // Delete the save
  await Save.deleteOne({ userId, slug: slug.toLowerCase() });

  // Update User model savedStories array
  await User.updateOne(
    { _id: userId },
    { 
      $pull: {
        savedStories: { slug: slug.toLowerCase() }
      }
    }
  );

  // Decrement story save count
  if (saveDoc.storyId) {
    await Story.updateOne(
      { _id: saveDoc.storyId },
      { $inc: { 'stats.savedCount': -1 } }
    );
  }

  return { unsaved: true, storyId: saveDoc.storyId };
};

// GET /api/saves - Get all saved stories for user
export const getSavedStories = async (req, res) => {
  try {
    console.log('[READ_FLOW]', {
      route: req.originalUrl,
      userId: req.userId,
    });
    console.log('[VERIFY_CONTROLLER_ENTRY]', req.path, { userId: req.userId, email: req.userEmail });
    if (!req.userId) {
      return errorResponse(res, 'Authentication required', 'UNAUTHENTICATED', 401);
    }

    // Note: GET endpoint is exempt from rate limiting for persistency

    // Check MongoDB connection type
    const useTransactions = await checkMongoDBConnection();
    
      if (useTransactions) {
      // Use transactional approach
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          const savedStories = await getSavedStoriesData(req.userId, session);
            console.log('[READ_FLOW]', { route: req.originalUrl, userId: req.userId, itemsReturned: savedStories.length });
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            return successResponse(res, { savedStories });
        });
      } finally {
        await session.endSession();
      }
    } else {
      // Use non-transactional approach
      const savedStories = await getSavedStoriesData(req.userId);
        console.log('[READ_FLOW]', { route: req.originalUrl, userId: req.userId, itemsReturned: savedStories.length });
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return successResponse(res, { savedStories });
    }
  } catch (error) {
    console.error('[saveController:getSavedStories] error:', error);
    return errorResponse(res, 'Failed to fetch saved stories', 'SERVER_ERROR', 500);
  }
};

// POST /api/saves - Save a story
export const saveStory = async (req, res) => {
  try {
    console.log('[SAVE_FLOW]', {
      route: req.originalUrl,
      userId: req.userId,
      storySlug: req.body?.storySlug || req.params?.slug,
    });
    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    console.log('[DB_WRITE]', { userId: req.userId, asObjectId: userObjectId.toString() });
    if (!req.userId) {
      return errorResponse(res, 'Authentication required', 'UNAUTHENTICATED', 401);
    }

    // Rate limiting
    if (!checkRateLimit(req.userId)) {
      return errorResponse(res, 'Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const { storySlug } = req.body;
    if (!storySlug || typeof storySlug !== 'string') {
      return errorResponse(res, 'Invalid story slug', 'BAD_REQUEST', 400);
    }

    // Find the story
    const story = await Story.findOne(
      { slug: storySlug, isActive: true },
      { _id: 1, slug: 1, title: 1, 'assets.images': 1 }
    ).lean();

    if (!story) {
      return errorResponse(res, 'Story not found', 'NOT_FOUND', 404);
    }

    const coverUrl = story.assets?.images?.[0] || null;

    // Check MongoDB connection type
    const useTransactions = await checkMongoDBConnection();
    
    if (useTransactions) {
      // Use transactional approach
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Check if already saved (optimistic integrity check)
          const existingSave = await Save.findOne(
            { userId: userObjectId, storyId: story._id },
            { _id: 1 }
          ).lean().session(session);

          if (existingSave) {
            // Already saved - return current state gracefully
            const savedStories = await getSavedStoriesData(req.userId, session);
            return successResponse(res, { 
              savedStories,
              message: 'Story already saved'
            });
          }

          // Create new save
          const newSave = new Save({
            userId: userObjectId,
            storyId: story._id,
            slug: story.slug.toLowerCase(),
            title: story.title,
            coverUrl,
            createdAt: new Date()
          });

          await newSave.save({ session });

          // Update User model savedStories array
          const userUpdTxAdd = await User.updateOne(
            { _id: userObjectId },
            { 
              $addToSet: {
                savedStories: {
                  slug: story.slug.toLowerCase(),
                  savedAt: new Date(),
                  title: story.title,
                  coverImage: coverUrl
                }
              }
            }
          ).session(session);
          console.log('[DB_RESULT]', userUpdTxAdd);
          console.log('[SAVE_WRITE]', { userId: String(req.userId), matchedCount: userUpdTxAdd.matchedCount, modifiedCount: userUpdTxAdd.modifiedCount });

          // Increment story save count
          await Story.updateOne(
            { _id: story._id },
            { $inc: { 'stats.savedCount': 1 } }
          ).session(session);

          // Log save event
          await logContentEvent(eventTypes.SAVE_CREATE, req.userId, {
            slug: storySlug,
            storyId: String(story._id)
          });

          // Return updated saved stories list
          const savedStories = await getSavedStoriesData(req.userId, session);
          res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
          return successResponse(res, { 
            savedStories,
            message: 'Story saved successfully'
          });
        });
      } finally {
        await session.endSession();
      }
    } else {
      // Use non-transactional approach
      const result = await saveStoryNonTransactional(req.userId, storySlug, story, coverUrl);
      
      if (result.alreadySaved) {
        const savedStories = await getSavedStoriesData(req.userId);
        return successResponse(res, { 
          savedStories,
          message: 'Story already saved'
        });
      }

      // Log save event
      await logContentEvent(eventTypes.SAVE_CREATE, req.userId, {
        slug: storySlug,
        storyId: String(story._id)
      });

      // Return updated saved stories list
      const savedStories = await getSavedStoriesData(req.userId);
      console.log('[SAVE_FLOW][DB_RESULT]', { matchedCount: 1, modifiedCount: 1, acknowledged: true });
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      return successResponse(res, { 
        savedStories,
        message: 'Story saved successfully'
      });
    }
  } catch (error) {
    console.error('[saveController:saveStory] error:', error);
    return errorResponse(res, 'Failed to save story', 'SERVER_ERROR', 500);
  }
};

// DELETE /api/saves/:slug - Remove a saved story
export const unsaveStory = async (req, res) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Authentication required', 'UNAUTHENTICATED', 401);
    }
    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    console.log('[DB_WRITE]', { userId: req.userId, asObjectId: userObjectId.toString() });

    // Rate limiting
    if (!checkRateLimit(req.userId)) {
      return errorResponse(res, 'Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const { slug } = req.params;
    if (!slug || typeof slug !== 'string') {
      return errorResponse(res, 'Invalid story slug', 'BAD_REQUEST', 400);
    }

    // Check MongoDB connection type
    const useTransactions = await checkMongoDBConnection();
    
    if (useTransactions) {
      // Use transactional approach
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Find the save to get storyId
          const saveDoc = await Save.findOne(
            { userId: userObjectId, slug: slug.toLowerCase() },
            { storyId: 1, _id: 1 }
          ).lean().session(session);

          if (!saveDoc) {
            // Idempotent: already not saved
            const savedStories = await getSavedStoriesData(req.userId, session);
            return successResponse(res, { 
              savedStories,
              message: 'Story was not saved'
            });
          }

          // Delete the save
          await Save.deleteOne({ userId: userObjectId, slug: slug.toLowerCase() }).session(session);

          // Update User model savedStories array
          const userUpdPullTx = await User.updateOne(
            { _id: userObjectId },
            { 
              $pull: {
                savedStories: { slug: slug.toLowerCase() }
              }
            }
          ).session(session);
          console.log('[DB_RESULT]', userUpdPullTx);
          console.log('[SAVE_WRITE]', { userId: String(req.userId), matchedCount: userUpdPullTx.matchedCount, modifiedCount: userUpdPullTx.modifiedCount });

          // Decrement story save count
          if (saveDoc.storyId) {
            await Story.updateOne(
              { _id: saveDoc.storyId },
              { $inc: { 'stats.savedCount': -1 } }
            ).session(session);
          }

          // Log unsave event
          await logContentEvent(eventTypes.SAVE_DELETE, req.userId, {
            slug: slug,
            storyId: String(saveDoc.storyId)
          });

          // Return updated saved stories list
          const savedStories = await getSavedStoriesData(req.userId, session);
          return successResponse(res, { 
            savedStories,
            message: 'Story removed from saved stories'
          });
        });
      } finally {
        await session.endSession();
      }
    } else {
      // Use non-transactional approach
      const result = await unsaveStoryNonTransactional(req.userId, slug);
      
      if (result.notFound) {
        const savedStories = await getSavedStoriesData(req.userId);
        return successResponse(res, { 
          savedStories,
          message: 'Story was not saved'
        });
      }

      // Log unsave event
      await logContentEvent(eventTypes.SAVE_DELETE, req.userId, {
        slug: slug,
        storyId: String(result.storyId)
      });

      // Return updated saved stories list
      const savedStories = await getSavedStoriesData(req.userId);
      return successResponse(res, { 
        savedStories,
        message: 'Story removed from saved stories'
      });
    }
  } catch (error) {
    console.error('[saveController:unsaveStory] error:', error);
    return errorResponse(res, 'Failed to remove saved story', 'SERVER_ERROR', 500);
  }
};

// GET /api/saves/:slug/is-saved - Check if story is saved
export const checkStorySaved = async (req, res) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Authentication required', 'UNAUTHENTICATED', 401);
    }

    const { slug } = req.params;
    if (!slug || typeof slug !== 'string') {
      return errorResponse(res, 'Invalid story slug', 'BAD_REQUEST', 400);
    }

    const story = await Story.findOne(
      { slug: slug.toLowerCase(), isActive: true },
      { _id: 1 }
    ).lean();

    if (!story) {
      return errorResponse(res, 'Story not found', 'NOT_FOUND', 404);
    }

    const existingSave = await Save.findOne(
      { userId: req.userId, storyId: story._id },
      { _id: 1 }
    ).lean();

    return successResponse(res, { saved: !!existingSave });
  } catch (error) {
    console.error('[saveController:checkStorySaved] error:', error);
    return errorResponse(res, 'Failed to check save status', 'SERVER_ERROR', 500);
  }
};
