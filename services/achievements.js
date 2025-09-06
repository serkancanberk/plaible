import mongoose from "mongoose";
import { Achievement } from "../models/Achievement.js";
import { UserAchievement } from "../models/UserAchievement.js";
import { Session } from "../models/Session.js";
import { logEvent } from "./eventLog.js";

export async function listUnlocked(userId, { limit = 50, cursor } = {}) {
  const query = { userId: new mongoose.Types.ObjectId(userId) };
  if (cursor) {
    query.unlockedAt = { $lt: new Date(cursor) };
  }

  const userAchievements = await UserAchievement.find(query)
    .sort({ unlockedAt: -1 })
    .limit(limit)
    .lean();

  // Join with Achievement data
  const achievementCodes = userAchievements.map(ua => ua.achievementCode);
  const achievements = await Achievement.find({ code: { $in: achievementCodes } }).lean();
  const achievementMap = new Map(achievements.map(a => [a.code, a]));

  return userAchievements.map(ua => {
    const achievement = achievementMap.get(ua.achievementCode);
    return {
      code: ua.achievementCode,
      name: achievement?.name || ua.achievementCode,
      description: achievement?.description || "",
      unlockedAt: ua.unlockedAt,
      icon: achievement?.icon || null,
      category: achievement?.category || "general"
    };
  });
}

export async function evaluateAndUnlock({ userId, storyId, sessionId } = {}) {
  // Load enabled achievements
  const achievements = await Achievement.find({ enabled: true }).lean();
  
  // Load user context
  const sessions = await Session.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  const completedCount = sessions.filter(s => s.progress?.completed).length;
  const unlocked = [];
  let created = 0;

  for (const achievement of achievements) {
    const { rule } = achievement;
    let shouldUnlock = false;
    let contextStoryId = storyId || null;
    let contextSessionId = sessionId || null;

    if (rule.kind === "relationship") {
      // Check if any session has the required relationship trust level
      for (const session of sessions) {
        if (session.mirror?.relationships) {
          const relationship = session.mirror.relationships.find(
            r => r.characterId === rule.relationship.characterId
          );
          if (relationship && relationship.trust >= rule.relationship.gte) {
            shouldUnlock = true;
            contextStoryId = session.storyId;
            contextSessionId = session._id;
            break;
          }
        }
      }
    } else if (rule.kind === "progress") {
      // Check if any session has reached the required chapter
      for (const session of sessions) {
        if ((session.progress?.chapter || 0) >= rule.progress.chapterGte) {
          shouldUnlock = true;
          contextStoryId = session.storyId;
          contextSessionId = session._id;
          break;
        }
      }
    } else if (rule.kind === "criticalBeat") {
      // Check if any session has the critical beat
      for (const session of sessions) {
        if (session.mirror?.criticalBeats?.includes(rule.criticalBeat.code)) {
          shouldUnlock = true;
          contextStoryId = session.storyId;
          contextSessionId = session._id;
          break;
        }
      }
    } else if (rule.kind === "completionCount") {
      // Check completion count
      if (completedCount >= rule.completionCount.gte) {
        shouldUnlock = true;
        // Use the most recent completed session for context
        const lastCompleted = sessions.find(s => s.progress?.completed);
        if (lastCompleted) {
          contextStoryId = lastCompleted.storyId;
          contextSessionId = lastCompleted._id;
        }
      }
    }

    if (shouldUnlock) {
      const dedupeKey = `${userId}:${achievement.code}`;
      try {
        const result = await UserAchievement.updateOne(
          { dedupeKey },
          {
            $setOnInsert: {
              userId: new mongoose.Types.ObjectId(userId),
              achievementCode: achievement.code,
              storyId: contextStoryId,
              sessionId: contextSessionId ? new mongoose.Types.ObjectId(contextSessionId) : null,
              unlockedAt: new Date(),
              dedupeKey
            }
          },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) {
          created++;
          unlocked.push(achievement.code);
          // Log achievement unlock event
          logEvent({
            type: "achievement.unlocked",
            userId,
            meta: {
              code: achievement.code,
              storyId: contextStoryId,
              sessionId: contextSessionId
            }
          }).catch(() => {}); // best-effort, never throws
        }
      } catch (error) {
        // Ignore duplicate key errors (race conditions)
        if (error.code !== 11000) {
          console.error(`Error unlocking achievement ${achievement.code}:`, error);
        }
      }
    }
  }

  return { created, unlocked };
}

export async function getStats(userId) {
  const sessions = await Session.find({ userId }).lean();
  
  // Stories played (distinct storyIds)
  const storiesPlayed = new Set(sessions.map(s => s.storyId)).size;
  
  // Completions
  const completions = sessions.filter(s => s.progress?.completed).length;
  
  // Average rating (from feedbacks - we'll need to check if this exists)
  let avgRating = null;
  try {
    const { Feedback } = await import("../models/Feedback.js");
    const feedbacks = await Feedback.find({ userId }).lean();
    if (feedbacks.length > 0) {
      const totalRating = feedbacks.reduce((sum, f) => sum + (f.stars || 0), 0);
      avgRating = totalRating / feedbacks.length;
    }
  } catch (error) {
    // Feedback model might not exist, that's ok
  }
  
  // Alignments (relationship trust averages by character)
  const alignments = [];
  const characterTrust = new Map();
  
  for (const session of sessions) {
    if (session.mirror?.relationships) {
      for (const rel of session.mirror.relationships) {
        if (!characterTrust.has(rel.characterId)) {
          characterTrust.set(rel.characterId, []);
        }
        characterTrust.get(rel.characterId).push(rel.trust || 0);
      }
    }
  }
  
  for (const [characterId, trusts] of characterTrust) {
    const trustAvg = trusts.reduce((sum, t) => sum + t, 0) / trusts.length;
    alignments.push({ characterId, trustAvg: Math.round(trustAvg * 100) / 100 });
  }
  
  // Sort by trust average descending
  alignments.sort((a, b) => b.trustAvg - a.trustAvg);
  
  // Achievements
  const userAchievements = await UserAchievement.find({ userId }).lean();
  const achievements = userAchievements.map(ua => ua.achievementCode);
  
  return {
    storiesPlayed,
    completions,
    avgRating,
    alignments,
    achievements
  };
}
