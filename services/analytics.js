import { Event } from "../models/Event.js";
import { AnalyticsDaily } from "../models/AnalyticsDaily.js";
import { logEvent } from "./eventLog.js";

/**
 * Generate today's date in YYYY-MM-DD format
 */
function todayYYYYMMDD() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Tick daily analytics - aggregate events into daily analytics
 * @param {Object} params
 * @param {string} params.date - Date in YYYY-MM-DD format, defaults to today
 */
export async function tickDaily({ date = todayYYYYMMDD() } = {}) {
  try {
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    // Get all events for the day
    const events = await Event.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    // Initialize analytics object
    const analytics = {
      date,
      dau: 0,
      sessionsStarted: 0,
      turns: 0,
      completions: 0,
      moderationBlocked: 0,
      walletTopups: 0,
      creditsPurchased: 0,
      reengagementSent: 0,
      achievementUnlocked: 0,
      sseConnections: 0,
      storyBreakdown: new Map()
    };

    // Track unique users for DAU
    const uniqueUsers = new Set();

    // Process events
    for (const event of events) {
      if (event.userId) {
        uniqueUsers.add(event.userId.toString());
      }

      switch (event.type) {
        case 'storyrunner.start':
          analytics.sessionsStarted++;
          if (event.meta?.storyId) {
            const storyId = event.meta.storyId;
            if (!analytics.storyBreakdown.has(storyId)) {
              analytics.storyBreakdown.set(storyId, { starts: 0, turns: 0, completions: 0, avgChapterCost: 0 });
            }
            analytics.storyBreakdown.get(storyId).starts++;
          }
          break;

        case 'storyrunner.turn':
          analytics.turns++;
          if (event.meta?.storyId) {
            const storyId = event.meta.storyId;
            if (!analytics.storyBreakdown.has(storyId)) {
              analytics.storyBreakdown.set(storyId, { starts: 0, turns: 0, completions: 0, avgChapterCost: 0 });
            }
            analytics.storyBreakdown.get(storyId).turns++;
          }
          break;

        case 'session.complete':
          analytics.completions++;
          if (event.meta?.storyId) {
            const storyId = event.meta.storyId;
            if (!analytics.storyBreakdown.has(storyId)) {
              analytics.storyBreakdown.set(storyId, { starts: 0, turns: 0, completions: 0, avgChapterCost: 0 });
            }
            analytics.storyBreakdown.get(storyId).completions++;
          }
          break;

        case 'storyrunner.moderation':
          if (event.meta?.blocked) {
            analytics.moderationBlocked++;
          }
          break;

        case 'wallet.topup':
          analytics.walletTopups++;
          if (event.meta?.amount) {
            analytics.creditsPurchased += event.meta.amount;
          }
          break;

        case 'reengagement.sent':
          analytics.reengagementSent++;
          break;

        case 'achievement.unlocked':
          analytics.achievementUnlocked++;
          break;

        case 'sse.client_connected':
          analytics.sseConnections++;
          break;
      }
    }

    analytics.dau = uniqueUsers.size;

    // Convert Map to Object for MongoDB storage
    const storyBreakdownObj = {};
    for (const [storyId, data] of analytics.storyBreakdown) {
      storyBreakdownObj[storyId] = data;
    }
    analytics.storyBreakdown = storyBreakdownObj;

    // Upsert analytics record
    await AnalyticsDaily.findOneAndUpdate(
      { date },
      analytics,
      { upsert: true, new: true }
    );

    // Log the analytics tick
    await logEvent({
      type: "admin.analytics.tick",
      userId: null, // System action
      meta: { date, eventsProcessed: events.length, dau: analytics.dau },
      level: "info"
    });

    return { date, eventsProcessed: events.length, ...analytics };
  } catch (error) {
    console.error("Analytics tick error:", error);
    // Log error but don't throw
    await logEvent({
      type: "admin.analytics.tick",
      userId: null,
      meta: { date, error: error.message },
      level: "error"
    });
    return { date, error: error.message };
  }
}

/**
 * Get analytics overview for a period
 * @param {Object} params
 * @param {string} params.period - "7d" or "30d"
 */
export async function getOverview({ period = "7d" } = {}) {
  try {
    const days = period === "30d" ? 30 : 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const analytics = await AnalyticsDaily.find({
      date: {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0]
      }
    }).sort({ date: 1 }).lean();

    const series = analytics.map(day => ({
      date: day.date,
      dau: day.dau,
      turns: day.turns,
      completions: day.completions,
      walletTopups: day.walletTopups,
      creditsPurchased: day.creditsPurchased,
      moderationBlocked: day.moderationBlocked
    }));

    const totals = {
      dau: Math.max(...analytics.map(d => d.dau), 0),
      turns: analytics.reduce((sum, d) => sum + d.turns, 0),
      completions: analytics.reduce((sum, d) => sum + d.completions, 0),
      walletTopups: analytics.reduce((sum, d) => sum + d.walletTopups, 0),
      creditsPurchased: analytics.reduce((sum, d) => sum + d.creditsPurchased, 0),
      moderationBlocked: analytics.reduce((sum, d) => sum + d.moderationBlocked, 0)
    };

    return { series, totals };
  } catch (error) {
    console.error("Analytics overview error:", error);
    return { series: [], totals: {} };
  }
}

/**
 * Get story analytics for a period
 * @param {Object} params
 * @param {string} params.period - "7d" or "30d"
 */
export async function getStories({ period = "7d" } = {}) {
  try {
    const days = period === "30d" ? 30 : 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const analytics = await AnalyticsDaily.find({
      date: {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0]
      }
    }).lean();

    // Aggregate story data across all days
    const storyMap = new Map();
    
    for (const day of analytics) {
      if (day.storyBreakdown) {
        for (const [storyId, data] of Object.entries(day.storyBreakdown)) {
          if (!storyMap.has(storyId)) {
            storyMap.set(storyId, { starts: 0, turns: 0, completions: 0 });
          }
          const story = storyMap.get(storyId);
          story.starts += data.starts || 0;
          story.turns += data.turns || 0;
          story.completions += data.completions || 0;
        }
      }
    }

    // Convert to array and calculate completion rates
    const items = Array.from(storyMap.entries()).map(([storyId, data]) => ({
      storyId,
      starts: data.starts,
      turns: data.turns,
      completions: data.completions,
      completionRate: data.starts > 0 ? (data.completions / data.starts) : 0
    })).sort((a, b) => b.starts - a.starts);

    return { items };
  } catch (error) {
    console.error("Analytics stories error:", error);
    return { items: [] };
  }
}
