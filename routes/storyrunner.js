import { Router } from "express";
import mongoose from "mongoose";
import { Story } from "../models/Story.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { selectProvider, generateStart, generateTurn } from "../services/llmProvider.js";
import { moderateUserInput } from "../services/moderation.js";
import { logStoryRunnerEvent, eventTypes } from "../services/eventLog.js";
import { emit } from "../middleware/memorySSE.js";

// Lightweight validators and helpers (mirror sessions router style)
function isNonEmptyString(v) { return typeof v === "string" && v.trim().length > 0; }
function toSlug(v) { return String(v || "").trim().toLowerCase(); }
function isObjectId(v) { try { return mongoose.Types.ObjectId.isValid(String(v)); } catch { return false; } }
function ok(res, data) { return res.json({ ok: true, ...data }); }
function err(res, code = 500, name = "SERVER_ERROR", field) {
  const body = field ? { error: name, field } : { error: name };
  return res.status(code).json(body);
}


const router = Router();

/**
 * @swagger
 * /api/storyrunner/start:
 *   post:
 *     tags: [StoryRunner]
 *     summary: Start a new interactive story session
 *     description: Creates a new story session and generates the initial scene
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storySlug
 *               - characterId
 *             properties:
 *               storySlug:
 *                 type: string
 *                 description: The story identifier
 *                 example: "the-picture-of-dorian-gray"
 *               characterId:
 *                 type: string
 *                 description: The character to play as
 *                 example: "chr_dorian"
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional role identifiers
 *                 example: ["role_artist", "role_gentleman"]
 *               resume:
 *                 type: boolean
 *                 description: Whether to resume an existing session
 *                 default: false
 *     responses:
 *       200:
 *         description: Session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 sessionId:
 *                   type: string
 *                   description: The session identifier
 *                   example: "68badfecd69761f15d790d09"
 *                 story:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "The Picture of Dorian Gray"
 *                     slug:
 *                       type: string
 *                       example: "the-picture-of-dorian-gray"
 *                 scene:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: "You find yourself in a luxurious Victorian drawing room..."
 *                     choices:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Explore the room", "Look at the painting", "Speak to someone"]
 *                 progress:
 *                   type: object
 *                   properties:
 *                     chapter:
 *                       type: number
 *                       example: 1
 *                     completed:
 *                       type: boolean
 *                       example: false
 *                 wallet:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       example: 100
 *       400:
 *         description: Bad request - invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "BAD_REQUEST"
 *                 field:
 *                   type: string
 *                   example: "storySlug"
 *       401:
 *         description: Unauthenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "UNAUTHENTICATED"
 *       404:
 *         description: Story not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "NOT_FOUND"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "SERVER_ERROR"
 */
// POST /api/storyrunner/start
router.post("/start", async (req, res) => {
  try {
    console.log("🔹 Incoming payload:", req.body);
    console.log("🔹 Resolved user:", req.userId);
    
    if (!req.userId) return err(res, 401, "UNAUTHENTICATED");

    const body = req.body || {};
    const storySlug = toSlug(body.storySlug);
    const characterId = isNonEmptyString(body.characterId) ? body.characterId.trim() : "";
    const roleIdsRaw = body.roleIds;
    const resume = body.resume === true;
    
    console.log("🔹 Processed storySlug:", storySlug);
    console.log("🔹 Processed characterId:", characterId);

    if (!isNonEmptyString(storySlug)) return err(res, 400, "BAD_REQUEST", "storySlug");
    if (!isNonEmptyString(characterId)) return err(res, 400, "BAD_REQUEST", "characterId");
    if (roleIdsRaw !== undefined && !(Array.isArray(roleIdsRaw) && roleIdsRaw.every(r => typeof r === "string"))) {
      return err(res, 400, "BAD_REQUEST", "roleIds");
    }

    const story = await Story.findOne({ slug: storySlug, isActive: true }).lean();
    console.log("🔹 Story lookup result:", story?.title, "Characters count:", story?.characters?.length);
    if (!story) return res.status(404).json({ error: "STORY_NOT_FOUND", message: "Story not found" });

    const character = (story.characters || []).find(c => c.id === characterId);
    console.log("🔹 Character lookup result:", character);
    if (!character) return res.status(404).json({ error: "CHARACTER_NOT_FOUND", message: "Character not found" });
    
    // Defensive checks for required data
    if (!story.content && !story.storyrunner?.storyPrompt) {
      console.warn("⚠️ Story missing content and storyPrompt");
    }
    
    if (!character.personality && !character.summary) {
      console.warn("⚠️ Character missing personality and summary");
    }

    let roleIds = [];
    if (Array.isArray(roleIdsRaw)) {
      roleIds = roleIdsRaw.filter(r => typeof r === "string");
      const validRoleIdSet = new Set((story.roles || []).map(r => r.id));
      const invalid = roleIds.find(r => !validRoleIdSet.has(r));
      if (invalid) return err(res, 400, "BAD_REQUEST", "roleIds");
    }

    // If resume requested and there is an active session, return the latest scene
    const active = await Session.findOne({
      userId: req.userId,
      storyId: story._id,
      "progress.completed": false,
    }).lean();

    if (resume && active) {
      const lastScene = (active.log || []).slice().reverse().find(e => e.role === "storyrunner");
      const scene = lastScene ? { text: lastScene.text || lastScene.content || "", choices: lastScene.choices || [] } : { text: "", choices: [] };
      const userDoc = await User.findById(req.userId, "wallet.balance").lean();
      const balance = userDoc?.wallet?.balance ?? 0;
      
      // Log storyrunner start event (resume)
      await logStoryRunnerEvent(eventTypes.STORYRUNNER_START, req.userId, {
        storyId: String(story._id),
        sessionId: String(active._id),
        chapter: active.progress?.chapter || 1
      });
      
      return ok(res, {
        sessionId: String(active._id),
        story: { title: story.title, slug: story.slug },
        scene,
        progress: active.progress,
        wallet: { balance },
      });
    }

    // Ensure wallet has enough for chapter 1 and charge idempotently (reuse sessions logic)
    const cost = Number.isInteger(story?.pricing?.creditsPerChapter) && story.pricing.creditsPerChapter > 0
      ? story.pricing.creditsPerChapter
      : 10;

    const user = await User.findById(req.userId).lean();
    if (!user) return err(res, 404, "NOT_FOUND");
    const balance = user?.wallet?.balance ?? 0;

    // Existing active session guard (do not re-charge)
    if (active) {
      // Log storyrunner start event (existing session)
      await logStoryRunnerEvent(eventTypes.STORYRUNNER_START, req.userId, {
        storyId: String(story._id),
        sessionId: String(active._id),
        chapter: active.progress?.chapter || 1
      });
      
      return ok(res, {
        sessionId: String(active._id),
        story: { title: story.title, slug: story.slug },
        progress: active.progress,
        wallet: { balance },
      });
    }

    if (balance < cost) {
      return res.status(402).json({ error: "INSUFFICIENT_CREDITS", needed: cost, balance });
    }

    let alreadyCharged = false;
    const existingTx = await WalletTransaction.findOne({
      userId: req.userId,
      storyId: story._id,
      chapter: 1,
      type: "deduct",
    }).lean();
    if (!existingTx) {
      try {
        console.log("🔹 Creating wallet deduction transaction:", {
          userId: req.userId,
          cost,
          storyId: story._id,
          chapter: 1
        });
        
        await WalletTransaction.createDeduct(req.userId, cost, story._id, 1, "deduct:chapter");
        console.log("✅ Wallet deduction transaction created successfully");
      } catch (e) {
        console.error("❌ WalletTransaction.createDeduct error:", e);
        console.error("❌ Error details:", {
          message: e.message,
          code: e.code,
          name: e.name
        });
        
        if (e && e.code === 11000) {
          alreadyCharged = true;
          console.log("🔄 Duplicate transaction detected, skipping charge");
        } else {
          return res.status(500).json({ 
            error: "WALLET_TRANSACTION_ERROR", 
            message: e.message || "Failed to process wallet transaction",
            details: "Unable to deduct credits for story session"
          });
        }
      }
    } else {
      alreadyCharged = true;
      console.log("🔄 Existing transaction found, skipping charge");
    }
    if (!alreadyCharged) {
      await User.findByIdAndUpdate(req.userId, { $inc: { "wallet.balance": -cost } });
    }

    // Check for existing session before creating new one
    let sess = await Session.findOne({ 
      userId: req.userId, 
      storyId: story._id 
    }).lean();
    
    if (sess) {
      console.log(`🔁 Existing session found, reusing: ${sess._id}`);
      
      // Return existing session with current scene
      const lastScene = (sess.log || []).slice().reverse().find(e => e.role === "storyrunner");
      const scene = lastScene ? { text: lastScene.text || lastScene.content || "", choices: lastScene.choices || [] } : { text: "", choices: [] };
      
      const latest = await User.findById(req.userId, "wallet.balance").lean();
      const latestBalance = latest?.wallet?.balance ?? 0;
      
      return ok(res, {
        sessionId: String(sess._id),
        story: { 
          title: story.title, 
          slug: story.slug,
          character: {
            id: character.id,
            slug: character.slug || character.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
            name: character.name || 'Unknown Character',
            displayName: character.displayName || character.name || 'Unknown Character',
            assets: character.assets || {}
          }
        },
        scene: { text: scene.text, choices: scene.choices },
        progress: sess.progress,
        wallet: { balance: latestBalance },
      });
    }
    
    // Create new session
    console.log("🔹 Creating new session for user:", req.userId, "story:", story._id);
    
    try {
      sess = await Session.create({
        userId: new mongoose.Types.ObjectId(String(req.userId)),
        storyId: story._id,
        characterId,
        roleIds: Array.isArray(roleIds) ? roleIds : [],
        progress: {
          chapter: 1,
          chapterCountApprox: Number.isInteger(story?.pricing?.estimatedChapterCount) && story.pricing.estimatedChapterCount > 0
            ? story.pricing.estimatedChapterCount
            : 10,
          completed: false,
        },
        log: [],
        mirror: { roleAlignment: null, relationships: [], criticalBeats: [], hint: null, progressNote: null },
        finale: { requested: false, requestedAt: null },
        rating: { stars: null, text: null },
      });
      
      console.log(`✅ New session created: ${sess._id}`);
    } catch (error) {
      console.error("❌ Session creation error:", error);
      
      // Handle duplicate key error (E11000)
      if (error.code === 11000) {
        console.log("🔄 Duplicate session detected, finding existing session");
        
        // Find the existing session
        const existingSess = await Session.findOne({ 
          userId: req.userId, 
          storyId: story._id 
        }).lean();
        
        if (existingSess) {
          console.log(`🔁 Using existing session: ${existingSess._id}`);
          
          // Return existing session with current scene
          const lastScene = (existingSess.log || []).slice().reverse().find(e => e.role === "storyrunner");
          const scene = lastScene ? { text: lastScene.text || lastScene.content || "", choices: lastScene.choices || [] } : { text: "", choices: [] };
          
          const latest = await User.findById(req.userId, "wallet.balance").lean();
          const latestBalance = latest?.wallet?.balance ?? 0;
          
          return ok(res, {
            sessionId: String(existingSess._id),
            story: { 
              title: story.title, 
              slug: story.slug,
              character: {
                id: character.id,
                slug: character.slug || character.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
                name: character.name || 'Unknown Character',
                displayName: character.displayName || character.name || 'Unknown Character',
                assets: character.assets || {}
              }
            },
            scene: { text: scene.text, choices: scene.choices },
            progress: existingSess.progress,
            wallet: { balance: latestBalance },
          });
        }
      }
      
      // If not a duplicate key error or no existing session found, re-throw
      throw error;
    }

    // Build initial scene via LLM provider
    console.log("🔹 About to call generateStart with:", {
      storyTitle: story.title,
      characterId,
      roleIds: Array.isArray(roleIds) ? roleIds : [],
      storyContent: story.content ? "exists" : "missing",
      characterPersonality: character.personality ? "exists" : "missing"
    });
    
    const scene = await generateStart({
      story,
      characterId,
      roleIds: Array.isArray(roleIds) ? roleIds : [],
    });
    
    console.log("🔹 generateStart result:", { textLength: scene?.text?.length, choicesCount: scene?.choices?.length });

    sess.log.push({ role: "storyrunner", content: scene.text, choices: scene.choices, ts: new Date() });
    await sess.save();

    const latest = await User.findById(req.userId, "wallet.balance").lean();
    const latestBalance = latest?.wallet?.balance ?? 0;

    // Log storyrunner start event (new session)
    await logStoryRunnerEvent(eventTypes.STORYRUNNER_START, req.userId, {
      storyId: String(story._id),
      sessionId: String(sess._id),
      chapter: sess.progress?.chapter || 1
    });

    // Emit SSE event for real-time updates
    try {
      emit(String(sess._id), {
        kind: 'scene',
        scene: { text: scene.text, choices: scene.choices },
        progress: sess.progress,
        ts: new Date().toISOString()
      });
    } catch (error) {
      // Defensive: never throw from SSE emission
      console.warn('[SSE] Failed to emit start event:', error);
    }

    return ok(res, {
      sessionId: String(sess._id),
      story: { 
        title: story.title, 
        slug: story.slug,
        character: {
          id: character.id,
          slug: character.slug || character.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
          name: character.name || 'Unknown Character',
          displayName: character.displayName || character.name || 'Unknown Character',
          assets: character.assets || {}
        }
      },
      scene: { text: scene.text, choices: scene.choices },
      progress: sess.progress,
      wallet: { balance: latestBalance },
    });
  } catch (e) {
    console.error("❌ StoryRunner startSession error:", e);
    console.error("❌ Error stack:", e.stack);
    console.error("❌ Error message:", e.message);
    
    // Return more specific error information
    if (e.message && e.message.includes("Cannot read properties of undefined")) {
      return res.status(500).json({ 
        error: "MISSING_DATA", 
        message: e.message,
        details: "Required story or character data is missing"
      });
    }
    
    return res.status(500).json({ 
      error: "SERVER_ERROR", 
      message: e.message || "Internal server error",
      details: "An unexpected error occurred in the story runner"
    });
  }
});

/**
 * @swagger
 * /api/storyrunner/turn:
 *   post:
 *     tags: [StoryRunner]
 *     summary: Make a turn in an interactive story session
 *     description: Advances the story by making a choice or providing free text input
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - chosen
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: The session identifier
 *                 example: "68badfecd69761f15d790d09"
 *               chosen:
 *                 type: string
 *                 description: The choice made by the user
 *                 example: "Explore the room"
 *               freeText:
 *                 type: string
 *                 description: Optional free text input
 *                 example: "I want to examine the painting more closely"
 *               clientTurnId:
 *                 type: string
 *                 description: Client-side idempotency key
 *                 example: "turn_123_456"
 *     responses:
 *       200:
 *         description: Turn processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 sessionId:
 *                   type: string
 *                   description: The session identifier
 *                   example: "68badfecd69761f15d790d09"
 *                 scene:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: "You carefully examine the ornate painting..."
 *                     choices:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Continue exploring", "Ask about the painting", "Leave the room"]
 *                 progress:
 *                   type: object
 *                   properties:
 *                     chapter:
 *                       type: number
 *                       example: 1
 *                     completed:
 *                       type: boolean
 *                       example: false
 *                 log:
 *                   type: array
 *                   description: Recent session log entries
 *                   items:
 *                     type: object
 *                 wallet:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       example: 95
 *       400:
 *         description: Bad request - invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "BAD_REQUEST"
 *                 field:
 *                   type: string
 *                   example: "sessionId"
 *       401:
 *         description: Unauthenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "UNAUTHENTICATED"
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "NOT_FOUND"
 *       409:
 *         description: Duplicate turn (idempotency)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 sessionId:
 *                   type: string
 *                   example: "68badfecd69761f15d790d09"
 *                 scene:
 *                   type: object
 *                 progress:
 *                   type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "SERVER_ERROR"
 */
// POST /api/storyrunner/turn
router.post("/turn", async (req, res) => {
  try {
    if (!req.userId) return err(res, 401, "UNAUTHENTICATED");

    const body = req.body || {};
    const sessionId = String(body.sessionId || "").trim();
    const chosen = typeof body.chosen === "string" ? body.chosen : "";
    const freeText = typeof body.freeText === "string" ? body.freeText : "";
    const clientTurnId = typeof body.clientTurnId === "string" ? body.clientTurnId.trim() : "";
    const advanceChapter = body.advanceChapter === true;

    if (!isObjectId(sessionId)) return err(res, 400, "BAD_REQUEST", "sessionId");
    if (!isNonEmptyString(chosen) && !isNonEmptyString(freeText)) return err(res, 400, "BAD_REQUEST", "turn");
    if (freeText && freeText.length > 1000) return err(res, 400, "BAD_REQUEST", "freeText");

    const sess = await Session.findOne({ _id: sessionId, userId: req.userId });
    if (!sess) return err(res, 404, "NOT_FOUND");

    // Moderate user text if provided
    if (freeText) {
      const moderation = await moderateUserInput(freeText);
      if (!moderation.ok) {
        // Log moderation blocked event
        await logStoryRunnerEvent(eventTypes.STORYRUNNER_MODERATION, req.userId, {
          storyId: String(sess.storyId),
          sessionId: sessionId,
          moderated: true,
          code: moderation.code
        });
        return err(res, 400, "MODERATION_BLOCKED");
      }
    }

    const story = await Story.findById(sess.storyId).lean();
    if (!story) return err(res, 404, "NOT_FOUND");

    // Idempotency: if a previous user log appears to match the same clientTurnId, return last scene
    if (clientTurnId) {
      const userDup = (sess.log || []).find(e => e.role === "user" && typeof e.content === "string" && e.content.includes(`[ctid:${clientTurnId}]`));
      if (userDup) {
        const lastScene = (sess.log || []).slice().reverse().find(e => e.role === "storyrunner");
        const scene = lastScene ? { text: lastScene.text || lastScene.content || "", choices: lastScene.choices || [] } : { text: "", choices: [] };
        return res.status(409).json({ ok: true, sessionId: String(sess._id), scene, progress: sess.progress });
      }
    }

    // Optional chapter advance with wallet deduction using existing guard
    let updatedWalletBalance;
    if (advanceChapter && !sess.progress.completed) {
      const nextChapter = (sess.progress?.chapter || 1) + 1;
      const cost = Number.isInteger(story?.pricing?.creditsPerChapter) && story.pricing.creditsPerChapter > 0
        ? story.pricing.creditsPerChapter
        : 10;

      const userDoc = await User.findById(req.userId, "wallet.balance").lean();
      const balance = userDoc?.wallet?.balance ?? 0;
      if (balance < cost) {
        return res.status(402).json({ error: "INSUFFICIENT_CREDITS", needed: cost, balance });
      }

      try {
        console.log("🔹 Creating wallet deduction transaction for chapter advance:", {
          userId: req.userId,
          cost,
          storyId: sess.storyId,
          chapter: nextChapter
        });
        
        await WalletTransaction.createDeduct(req.userId, cost, sess.storyId, nextChapter, "deduct:chapter");
        console.log("✅ Wallet deduction transaction created successfully for chapter advance");
      } catch (e) {
        console.error("❌ WalletTransaction.createDeduct error (chapter advance):", e);
        console.error("❌ Error details:", {
          message: e.message,
          code: e.code,
          name: e.name
        });
        
        if (e && e.code === 11000) {
          console.log("🔄 Duplicate transaction detected for chapter advance, skipping charge");
          // already deducted for this chapter
        } else {
          return res.status(500).json({ 
            error: "WALLET_TRANSACTION_ERROR", 
            message: e.message || "Failed to process wallet transaction for chapter advance",
            details: "Unable to deduct credits for story chapter"
          });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.userId,
        { $inc: { "wallet.balance": -cost } },
        { new: true, projection: { "wallet.balance": 1 } }
      ).lean();
      updatedWalletBalance = updatedUser?.wallet?.balance ?? balance - cost;

      // Advance progress
      sess.progress.chapter = nextChapter;
      const approx = Number.isInteger(story?.pricing?.estimatedChapterCount) && story.pricing.estimatedChapterCount > 0
        ? story.pricing.estimatedChapterCount
        : 10;
      if (nextChapter >= approx) {
        sess.progress.completed = true;
      }
    }

    // Build prompt context: last 4 log entries
    const lastContext = (sess.log || []).slice(-4);

    // Append user turn (store clientTurnId marker in content for idempotency without schema change)
    const userContent = (freeText || chosen || "").trim();
    const contentWithCtid = clientTurnId ? `${userContent} [ctid:${clientTurnId}]` : userContent;
    sess.log.push({ role: "user", content: String(contentWithCtid).slice(0, 1000), choices: [], chosen: chosen || null, ts: new Date() });

    // Generate storyrunner turn
    const scene = await generateTurn({
      story,
      session: sess,
      chosen,
      freeText,
    });

    const srEntry = { role: "storyrunner", content: scene.text, choices: scene.choices, ts: new Date() };
    sess.log.push(srEntry);
    await sess.save();

    // Log storyrunner turn event
    await logStoryRunnerEvent(eventTypes.STORYRUNNER_TURN, req.userId, {
      storyId: String(story._id),
      sessionId: String(sess._id),
      moderated: !!freeText,
      chapter: sess.progress?.chapter || 1
    });

    // Emit SSE event for real-time updates
    try {
      emit(String(sess._id), {
        kind: 'scene',
        scene: { text: scene.text, choices: scene.choices },
        progress: sess.progress,
        ts: new Date().toISOString()
      });
    } catch (error) {
      // Defensive: never throw from SSE emission
      console.warn('[SSE] Failed to emit turn event:', error);
    }

    const response = {
      sessionId: String(sess._id),
      scene: { text: scene.text, choices: scene.choices },
      progress: sess.progress,
      log: sess.log.slice(-2),
    };
    if (updatedWalletBalance !== undefined) {
      response.wallet = { balance: updatedWalletBalance };
    }
    return ok(res, response);
  } catch (e) {
    return err(res, 500, "SERVER_ERROR");
  }
});

/**
 * @swagger
 * /api/storyrunner/session/{sessionId}/messages:
 *   get:
 *     tags: [StoryRunner]
 *     summary: Get messages for a story session
 *     description: Retrieves all messages/log entries for a specific story session
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID to fetch messages for
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         enum: [user, storyrunner]
 *                       content:
 *                         type: string
 *                       choices:
 *                         type: array
 *                         items:
 *                           type: string
 *                       ts:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "SESSION_NOT_FOUND"
 *                 message:
 *                   type: string
 *                   example: "The requested story session does not exist."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "SERVER_ERROR"
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
// GET /api/storyrunner/session/:sessionId/messages
router.get('/session/:sessionId/messages', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    console.log(`📨 Fetching messages for session: ${sessionId}`);
    
    const sess = await Session.findById(sessionId).lean();

    if (!sess) {
      console.warn(`⚠️ No session found for ID: ${sessionId}`);
      return res.status(404).json({
        error: 'SESSION_NOT_FOUND',
        message: 'The requested story session does not exist.'
      });
    }

    // Default to empty log if missing
    const messages = Array.isArray(sess.log) ? sess.log : [];

    console.log(`📨 Returning ${messages.length} messages for session ${sessionId}`);

    return res.status(200).json({
      sessionId,
      messages
    });
  } catch (error) {
    console.error('❌ Error fetching session messages:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Internal Server Error'
    });
  }
});

function characterNameFrom(story, characterId) {
  const c = (story?.characters || []).find(x => x.id === characterId);
  return c?.name || "You";
}

export default router;


