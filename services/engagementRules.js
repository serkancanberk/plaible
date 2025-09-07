import { ReengagementRule } from "../models/ReengagementRule.js";
import { EngagementMessage } from "../models/EngagementMessage.js";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import { Save } from "../models/Save.js";
import { Story } from "../models/Story.js";
import { logEvent } from "./eventLog.js"; // best-effort

const HOURS = (h) => h * 3600 * 1000;

function renderTemplate(tpl, ctx) {
  if (!tpl) return "";
  return tpl
    .replaceAll("{displayName}", ctx.displayName ?? "")
    .replaceAll("{storyTitle}", ctx.storyTitle ?? "");
}

function cooldownBucketStart(cooldownHours) {
  const ms = HOURS(cooldownHours || 72);
  const epoch = Math.floor(Date.now() / ms) * ms;
  return new Date(epoch);
}

export async function buildForUser(userId, deps = {}) {
  const {
    User: UserModel = User,
    ReengagementRule: ReengagementRuleModel = ReengagementRule,
    Session: SessionModel = Session,
    Save: SaveModel = Save,
    Story: StoryModel = Story
  } = deps;

  // Load context
  const user = await UserModel.findById(userId).lean();
  if (!user) return [];

  const [rules, latestActive, saves] = await Promise.all([
    ReengagementRuleModel.find({ enabled: true }).lean(),
    SessionModel.findOne({ userId, "progress.completed": false }).sort({ updatedAt: -1 }).lean(),
    SaveModel.find({ userId }).lean()
  ]);

  const walletBalance = user?.wallet?.balance ?? 0;

  // last turn timestamp from active session
  let lastTurnTs = null;
  if (latestActive?.log?.length) {
    // find max ts
    lastTurnTs = latestActive.log.reduce((acc, e) => !e?.ts ? acc : Math.max(acc, new Date(e.ts).getTime()), 0);
  }

  // helper: does user have a session for a given story?
  const sessionByStoryId = new Map();
  if (latestActive?.storyId) sessionByStoryId.set(String(latestActive.storyId), latestActive);

  // Evaluate each rule → zero or one message
  const messages = [];
  for (const rule of rules) {
    const { trigger } = rule;
    const type = trigger?.type;

    // Narrow story context where provided
    let story = null;
    if (rule.storyId) {
      story = await StoryModel.findById(rule.storyId).lean();
      if (!story?.isActive) continue; // ignore inactive
    }

    let shouldFire = false;
    let cta = { label: "Open", action: "resume", params: {} };
    let sessionId = null;

    if (type === "inactivity") {
      // Require an active session and a last turn older than hours
      if (latestActive && lastTurnTs && trigger.hours) {
        const age = Date.now() - lastTurnTs;
        if (age >= HOURS(trigger.hours)) {
          shouldFire = true;
          sessionId = String(latestActive._id);
          cta = { label: "Resume", action: "resume", params: { sessionId } };
        }
      }
    } else if (type === "lowCredits") {
      if (typeof trigger.lt === "number" && walletBalance < trigger.lt) {
        shouldFire = true;
        cta = { label: "Top up", action: "topup", params: {} };
      }
    } else if (type === "progress") {
      // If a story is specified and user has a session meeting progress,
      // or chapterGte===0 and user has a save for the story but no session → start CTA.
      if (rule.storyId) {
        const sess = sessionByStoryId.get(String(rule.storyId));
        if (sess) {
          if (typeof trigger.chapterGte === "number" && (sess.progress?.chapter ?? 0) >= trigger.chapterGte) {
            shouldFire = true;
            sessionId = String(sess._id);
            cta = { label: "Continue", action: "continue", params: { sessionId } };
          }
        } else {
          // saved but no session? then "start"
          const saved = saves.find(s => String(s.storyId) === String(rule.storyId));
          if (typeof trigger.chapterGte === "number" && trigger.chapterGte === 0 && saved) {
            shouldFire = true;
            cta = { label: "Start now", action: "start", params: { storySlug: saved.slug } };
          }
        }
      }
    } else if (type === "flag") {
      // Best-effort: check mirror.criticalBeats OR recent events (future)
      if (latestActive?.mirror?.criticalBeats?.some(code => code === trigger.code)) {
        shouldFire = true;
        sessionId = String(latestActive._id);
        cta = { label: "Resume", action: "resume", params: { sessionId } };
      }
    }

    if (!shouldFire) continue;

    const ctx = {
      displayName: user?.identity?.displayName ?? "there",
      storyTitle: story?.title
    };

    // Dedupe key with cooldown bucket
    const bucket = cooldownBucketStart(rule.cooldownHours);
    const dedupeKey = `${rule._id.toString()}:${bucket.toISOString()}`;

    messages.push({
      ruleId: rule._id,
      type,
      userId,
      storyId: rule.storyId ?? null,
      sessionId: sessionId ?? null,
      title: null, // optional; can be rendered in FE
      body: renderTemplate(rule.template, ctx),
      cta,
      status: "unread",
      dedupeKey,
      createdAt: new Date()
    });
  }

  return messages;
}

export async function upsertMessages(userId, msgs, deps = {}) {
  const { EngagementMessage: EngagementMessageModel = EngagementMessage } = deps;
  
  let created = 0;
  for (const m of msgs) {
    try {
      const res = await EngagementMessageModel.updateOne(
        { userId, dedupeKey: m.dedupeKey },
        { $setOnInsert: m },
        { upsert: true }
      );
      if (res.upsertedCount > 0) {
        created++;
        // best-effort analytics
        logEvent({ type: "reengagement.sent", userId, meta: { ruleId: m.ruleId, type: m.type, cta: m.cta?.action } }).catch(()=>{});
      }
    } catch (_) {
      // ignore dupe races
    }
  }
  return { created };
}
