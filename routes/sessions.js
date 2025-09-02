import { Router } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Story } from "../models/Story.js";
import { Session } from "../models/Session.js";
import { WalletTransaction } from "../models/WalletTransaction.js";

const router = Router();

// Temporary dev auth middleware - sets req.userId to fixed ObjectId if not present
const devAuth = (req, res, next) => {
  if (!req.userId) {
    req.userId = new mongoose.Types.ObjectId("64b7cafe1234567890cafe12");
  }
  next();
};

router.use(devAuth);

/** POST /api/sessions/start
 * Start a new story session with wallet deduction
 */
router.post("/start", async (req, res) => {
  const { storySlug, characterId, roleIds } = req.body;
  
  if (!storySlug || !characterId) {
    return res.status(400).json({ error: "Missing storySlug or characterId" });
  }

  try {
    // Load story by slug
    const story = await Story.findOne({ slug: storySlug, isActive: true });
    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Validate characterId exists in story
    const characterExists = story.characters.some(c => c.id === characterId);
    if (!characterExists) {
      return res.status(400).json({ error: "Invalid characterId" });
    }

    // Validate roleIds exist in story
    if (roleIds && Array.isArray(roleIds)) {
      const validRoleIds = story.roles.map(r => r.id);
      const invalidRoleId = roleIds.find(roleId => !validRoleIds.includes(roleId));
      if (invalidRoleId) {
        return res.status(400).json({ error: `Invalid roleId: ${invalidRoleId}` });
      }
    }

    const chapterToStart = 1;
    const cost = story.pricing?.creditsPerChapter || 10;

    // Try MongoDB transaction, fallback to non-transactional for local dev
    let transactionSuccess = false;
    try {
      const mongoSession = await mongoose.startSession();
      await mongoSession.withTransaction(async () => {
        // Re-load user for update
        const user = await User.findById(req.userId).session(mongoSession);
        if (!user) {
          throw new Error("User not found");
        }

        // Check wallet balance
        if (user.walletBalance < cost) {
          throw new Error("INSUFFICIENT_CREDITS");
        }

        // Deduct credits
        user.walletBalance -= cost;
        await user.save({ session: mongoSession });

        // Create wallet transaction
        await WalletTransaction.createDeduct(
          user._id, 
          cost, 
          story._id, 
          chapterToStart, 
          "deduct:chapter"
        ).session(mongoSession);

        // Create session
        const newSession = new Session({
          userId: user._id,
          storyId: story._id,
          characterId,
          roleIds: roleIds || [],
          progress: {
            chapter: chapterToStart,
            chapterCountApprox: story.pricing?.estimatedChapterCount || 10,
            completed: false
          },
          log: [],
          mirror: {
            roleAlignment: null,
            relationships: [],
            criticalBeats: [],
            hint: null,
            progressNote: "Opening chapter"
          },
          finale: {
            requested: false,
            requestedAt: null
          },
          rating: {
            stars: null,
            text: null
          }
        });

        await newSession.save({ session: mongoSession });
        req.newSessionId = newSession._id;
        req.newSessionProgress = newSession.progress;
        req.newWalletBalance = user.walletBalance;
      });
      transactionSuccess = true;
    } catch (txError) {
      console.log("Transaction failed, falling back to non-transactional:", txError.message);
      // Fallback: non-transactional operation
      const user = await User.findById(req.userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.walletBalance < cost) {
        throw new Error("INSUFFICIENT_CREDITS");
      }

      // Deduct credits
      user.walletBalance -= cost;
      await user.save();

      // Create wallet transaction
      await WalletTransaction.createDeduct(
        user._id, 
        cost, 
        story._id, 
        chapterToStart, 
        "deduct:chapter"
      );

      // Create session
      const newSession = new Session({
        userId: user._id,
        storyId: story._id,
        characterId,
        roleIds: roleIds || [],
        progress: {
          chapter: chapterToStart,
          chapterCountApprox: story.pricing?.estimatedChapterCount || 10,
          completed: false
        },
        log: [],
        mirror: {
          roleAlignment: null,
          relationships: [],
          criticalBeats: [],
          hint: null,
          progressNote: "Opening chapter"
        },
        finale: {
          requested: false,
          requestedAt: null
        },
        rating: {
          stars: null,
          text: null
        }
      });

      await newSession.save();
      req.newSessionId = newSession._id;
      req.newSessionProgress = newSession.progress;
      req.newWalletBalance = user.walletBalance;
    }

    res.status(201).json({
      sessionId: req.newSessionId,
      story: { title: story.title, slug: story.slug },
      progress: req.newSessionProgress,
      wallet: { balance: req.newWalletBalance }
    });

  } catch (err) {
    if (err.message === "INSUFFICIENT_CREDITS") {
      const user = await User.findById(req.userId);
      const balance = user?.walletBalance || 0;
      return res.status(402).json({
        error: "INSUFFICIENT_CREDITS",
        needed: cost,
        balance
      });
    }
    
    console.error("POST /api/sessions/start error:", err);
    res.status(500).json({ error: "Failed to start session" });
  }
});

/** GET /api/sessions/:id
 * Get session details by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findOne({ _id: sessionId, userId: req.userId });
    
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Convert to plain object and omit internal fields
    const sessionObj = session.toObject();
    delete sessionObj.__v;
    
    res.json({ session: sessionObj });
  } catch (err) {
    console.error("GET /api/sessions/:id error:", err);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

/** POST /api/sessions/:id/choice
 * Make a choice and potentially advance to next chapter
 */
router.post("/:id/choice", async (req, res) => {
  const { content, chosen, advanceChapter } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: "Missing content" });
  }

  try {
    // Load session belonging to user
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Append log entry
    session.log.push({
      role: "user",
      content,
      choices: null,
      chosen: chosen || null,
      ts: new Date().toISOString()
    });

    // Check if advancing to next chapter
    if (advanceChapter) {
      const nextChapter = session.progress.chapter + 1;
      
      if (nextChapter <= session.progress.chapterCountApprox) {
        // Try transaction, fallback to non-transactional
        try {
          const mongoSession = await mongoose.startSession();
          await mongoSession.withTransaction(async () => {
            // Load story and user for price/balance check
            const story = await Story.findById(session.storyId).session(mongoSession);
            const user = await User.findById(req.userId).session(mongoSession);
            
            if (!story || !user) {
              throw new Error("Story or user not found");
            }

            const cost = story.pricing?.creditsPerChapter || 10;
            
            // Check wallet balance
            if (user.walletBalance < cost) {
              throw new Error("INSUFFICIENT_CREDITS");
            }

            // Deduct credits
            user.walletBalance -= cost;
            await user.save({ session: mongoSession });

            // Create wallet transaction
            await WalletTransaction.createDeduct(
              user._id,
              cost,
              story._id,
              nextChapter,
              "deduct:chapter"
            ).session(mongoSession);

            // Update session progress
            session.progress.chapter = nextChapter;
            await session.save({ session: mongoSession });
            
            req.updatedWalletBalance = user.walletBalance;
          });
        } catch (txError) {
          console.log("Transaction failed, falling back to non-transactional:", txError.message);
          // Fallback: non-transactional operation
          const story = await Story.findById(session.storyId);
          const user = await User.findById(req.userId);
          
          if (!story || !user) {
            throw new Error("Story or user not found");
          }

          const cost = story.pricing?.creditsPerChapter || 10;
          
          if (user.walletBalance < cost) {
            throw new Error("INSUFFICIENT_CREDITS");
          }

          // Deduct credits
          user.walletBalance -= cost;
          await user.save();

          // Create wallet transaction
          await WalletTransaction.createDeduct(
            user._id,
            cost,
            story._id,
            nextChapter,
            "deduct:chapter"
          );

          // Update session progress
          session.progress.chapter = nextChapter;
          req.updatedWalletBalance = user.walletBalance;
        }
      } else {
        // Mark as completed
        session.progress.completed = true;
      }
    }

    // Save session (outside transaction if no advancement)
    await session.save();

    const response = {
      session: {
        progress: session.progress,
        log: session.log
      }
    };

    // Include wallet balance if it changed
    if (req.updatedWalletBalance !== undefined) {
      response.wallet = { balance: req.updatedWalletBalance };
    }

    res.json(response);

  } catch (err) {
    if (err.message === "INSUFFICIENT_CREDITS") {
      const user = await User.findById(req.userId);
      const story = await Story.findById(session?.storyId);
      const cost = story?.pricing?.creditsPerChapter || 10;
      const balance = user?.walletBalance || 0;
      
      return res.status(402).json({
        error: "INSUFFICIENT_CREDITS",
        needed: cost,
        balance
      });
    }
    
    console.error("POST /api/sessions/:id/choice error:", err);
    res.status(500).json({ error: "Failed to process choice" });
  }
});

export default router;
