// Lightweight Event Logging Service
// Never throws - best-effort logging with try/catch

import { Event } from "../models/Event.js";

/**
 * Log an event to the database
 * @param {Object} params
 * @param {string} params.type - Event type (required)
 * @param {string|ObjectId} params.userId - User ID (required)
 * @param {Object} params.meta - Additional metadata (optional)
 * @param {string} params.level - Log level: "info", "warn", "error" (default: "info")
 * @returns {Promise<boolean>} - true if logged successfully, false otherwise
 */
export async function logEvent({ type, userId, meta = {}, level = "info" }) {
  try {
    // Validate required parameters
    if (!type || !userId) {
      console.warn("EventLog: Missing required parameters", { type, userId });
      return false;
    }

    // Validate level
    if (!["info", "warn", "error"].includes(level)) {
      level = "info";
    }

    // Create event document
    const event = new Event({
      type: String(type),
      userId: userId,
      level: level,
      meta: meta || {},
      createdAt: new Date()
    });

    // Save to database
    await event.save();
    
    // Optional: Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[EventLog] ${level.toUpperCase()}: ${type}`, { userId, meta });
    }
    
    return true;
  } catch (error) {
    // Best-effort logging - never throw
    console.error("EventLog: Failed to log event", {
      type,
      userId,
      meta,
      level,
      error: error.message
    });
    return false;
  }
}

/**
 * Convenience functions for common event types
 */
export const eventTypes = {
  // Session events
  SESSION_START: "session.start",
  SESSION_CHOICE: "session.choice", 
  SESSION_COMPLETE: "session.complete",
  
  // StoryRunner events
  STORYRUNNER_START: "storyrunner.start",
  STORYRUNNER_TURN: "storyrunner.turn",
  STORYRUNNER_MODERATION: "storyrunner.moderation",
  
  // Wallet events
  WALLET_TOPUP: "wallet.topup",
  WALLET_DEDUCT: "wallet.deduct",
  WALLET_REFUND: "wallet.refund",
  
  // Content events
  FEEDBACK_CREATE: "feedback.create",
  FEEDBACK_DELETE: "feedback.delete",
  SAVE_CREATE: "save.create",
  SAVE_DELETE: "save.delete",
  
  // Achievement events
  ACHIEVEMENT_UNLOCKED: "achievement.unlocked"
};

/**
 * Helper function to log session events
 */
export async function logSessionEvent(type, userId, { storyId, chapter, cost, status }) {
  return logEvent({
    type,
    userId,
    meta: { storyId, chapter, cost, status },
    level: "info"
  });
}

/**
 * Helper function to log wallet events
 */
export async function logWalletEvent(type, userId, { amount, provider, txId }) {
  return logEvent({
    type,
    userId,
    meta: { amount, provider, txId },
    level: "info"
  });
}

/**
 * Helper function to log storyrunner events
 */
export async function logStoryRunnerEvent(type, userId, { storyId, sessionId, moderated, code, chapter }) {
  return logEvent({
    type,
    userId,
    meta: { storyId, sessionId, moderated, code, chapter },
    level: "info"
  });
}

/**
 * Helper function to log content events
 */
export async function logContentEvent(type, userId, { slug, storyId }) {
  return logEvent({
    type,
    userId,
    meta: { slug, storyId },
    level: "info"
  });
}
