import { Router } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { logWalletEvent, eventTypes } from "../services/eventLog.js";

const router = Router();

const ok = (res, data = {}) => res.json({ ok: true, ...data });
const err = (res, code = "BAD_REQUEST", http = 400, extra = {}) =>
  res.status(http).json({ error: code, ...extra });

function parsePositiveInt(v, min = 1, max = 100000) {
  const num = Number(v);
  if (!Number.isInteger(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

// 1) GET /api/wallet/me
router.get("/me", async (req, res) => {
  try {
    if (!req.userId) return err(res, "UNAUTHENTICATED", 401);
    const user = await User.findById(req.userId).lean();
    const balance = user?.wallet?.balance ?? 0;
    return ok(res, { balance });
  } catch (err) {
    return err(res, "SERVER_ERROR", 500);
  }
});

// 2) GET /api/wallet/transactions?limit=20&cursor=<createdAt_iso>
router.get("/transactions", async (req, res) => {
  try {
    if (!req.userId) return err(res, "UNAUTHENTICATED", 401);
    const limitRaw = req.query.limit;
    let limit = parsePositiveInt(limitRaw || 20, 1, 100);
    if (!limit) limit = 20;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const query = { userId: new mongoose.Types.ObjectId(String(req.userId)) };
    if (cursor && !isNaN(cursor.getTime())) {
      query.createdAt = { $lt: cursor };
    }

    const docs = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const items = (hasMore ? docs.slice(0, limit) : docs).map((d) => ({
      _id: d._id,
      type: d.type,
      amount: d.amount,
      storyId: d.storyId || null,
      chapter: d.chapter ?? null,
      provider: d.provider || "",
      providerRef: d.providerRef || "",
      createdAt: d.createdAt,
    }));

    const nextCursor = hasMore ? items[items.length - 1]?.createdAt?.toISOString() : undefined;
    return ok(res, nextCursor ? { items, nextCursor } : { items });
  } catch (err) {
    return err(res, "SERVER_ERROR", 500);
  }
});

/**
 * @swagger
 * /api/wallet/topup:
 *   post:
 *     tags: [Wallet]
 *     summary: Add credits to user wallet
 *     description: Increases the user's wallet balance by the specified amount
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100000
 *                 description: Amount of credits to add
 *                 example: 100
 *               provider:
 *                 type: string
 *                 description: Payment provider identifier
 *                 example: "stripe"
 *     responses:
 *       200:
 *         description: Credits added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 transactionId:
 *                   type: string
 *                   description: Transaction identifier
 *                   example: "68badfecd69761f15d790d09"
 *                 amount:
 *                   type: integer
 *                   example: 100
 *                 balance:
 *                   type: integer
 *                   description: New wallet balance
 *                   example: 150
 *       400:
 *         description: Bad request - invalid amount
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
 *                   example: "amount"
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
// 3) POST /api/wallet/topup
router.post("/topup", async (req, res) => {
  try {
    if (!req.userId) return err(res, "UNAUTHENTICATED", 401);
    const amount = parsePositiveInt(req.body?.amount);
    if (!amount) {
      return err(res, "BAD_REQUEST", 400, { field: "amount" });
    }

    const provider = typeof req.body?.provider === "string" ? req.body.provider : "";
    const providerRef = typeof req.body?.providerRef === "string" ? req.body.providerRef : "";

    // Before the transaction, log user and amount
    console.log("[wallet/topup] user", req.userId?.toString?.(), "amount", amount);
    
    // Create the transaction FIRST as before
    const tx = await WalletTransaction.createTopup(req.userId, amount, provider, providerRef);
    
    // Replace the update block with this simplified and reliable increment
    const updated = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { "wallet.balance": amount } },
      { new: true }
    );
    if (!updated) return err(res, "NOT_FOUND", 404);
    const balance = updated.wallet?.balance ?? 0;
    
    // Log wallet topup event
    await logWalletEvent(eventTypes.WALLET_TOPUP, req.userId, {
      amount: amount,
      provider: "api",
      txId: String(tx._id)
    });
    
    return ok(res, { balance, txId: tx._id });
  } catch (err) {
    // In the catch, log the error before returning
    console.error("[wallet/topup] error", err);
    return err(res, "SERVER_ERROR", 500);
  }
});

/**
 * @swagger
 * /api/wallet/deduct:
 *   post:
 *     tags: [Wallet]
 *     summary: Deduct credits from user wallet
 *     description: Decreases the user's wallet balance by the specified amount
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100000
 *                 description: Amount of credits to deduct
 *                 example: 10
 *               storyId:
 *                 type: string
 *                 description: Story identifier for context
 *                 example: "story_dorian_gray"
 *               chapter:
 *                 type: integer
 *                 description: Chapter number for context
 *                 example: 1
 *     responses:
 *       200:
 *         description: Credits deducted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 transactionId:
 *                   type: string
 *                   description: Transaction identifier
 *                   example: "68badfecd69761f15d790d09"
 *                 amount:
 *                   type: integer
 *                   example: 10
 *                 balance:
 *                   type: integer
 *                   description: New wallet balance
 *                   example: 90
 *       400:
 *         description: Bad request - invalid amount or insufficient balance
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
 *                   example: "amount"
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
// 4) POST /api/wallet/deduct
router.post("/deduct", async (req, res) => {
  try {
    if (!req.userId) return err(res, "UNAUTHENTICATED", 401);
    const amount = parsePositiveInt(req.body?.amount);
    if (!amount) {
      return err(res, "BAD_REQUEST", 400, { field: "amount" });
    }
    const storyId = typeof req.body?.storyId === "string" ? req.body.storyId : null;
    const chapter = Number.isInteger(req.body?.chapter) ? req.body.chapter : null;

    const user = await User.findById(req.userId);
    const balance = user?.wallet?.balance ?? 0;
    if (balance < amount) {
      return err(res, "INSUFFICIENT_CREDITS", 402, { balance });
    }

    try {
      const tx = await WalletTransaction.createDeduct(req.userId, amount, storyId, chapter, "deduct:api");
      const updated = await User.findByIdAndUpdate(
        req.userId,
        { $inc: { "wallet.balance": -amount } },
        { new: true }
      );
      
      // Log wallet deduct event
      await logWalletEvent(eventTypes.WALLET_DEDUCT, req.userId, {
        amount: amount,
        provider: "api",
        txId: String(tx._id)
      });
      
      return ok(res, { balance: updated?.wallet?.balance ?? 0, txId: tx._id });
    } catch (e) {
      if (process.env.NODE_ENV === "development" && process.env.AUTH_DEBUG === "1") {
        console.warn("[wallet] WARN non-transactional path:", e?.message);
      }
      // Fallback already sequential above
      return err(res, "SERVER_ERROR", 500);
    }
  } catch (err) {
    return err(res, "SERVER_ERROR", 500);
  }
});

/**
 * @swagger
 * /api/wallet/refund:
 *   post:
 *     tags: [Wallet]
 *     summary: Refund a wallet transaction
 *     description: Refunds credits from a previous transaction
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - txId
 *             properties:
 *               txId:
 *                 type: string
 *                 description: Transaction ID to refund
 *                 example: "68badfecd69761f15d790d09"
 *     responses:
 *       200:
 *         description: Transaction refunded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 refundId:
 *                   type: string
 *                   description: Refund transaction identifier
 *                   example: "68badfecd69761f15d790d10"
 *                 amount:
 *                   type: integer
 *                   example: 10
 *                 balance:
 *                   type: integer
 *                   description: New wallet balance
 *                   example: 110
 *       400:
 *         description: Bad request - invalid transaction ID
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
 *                   example: "txId"
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
 *         description: Transaction not found
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
// 5) POST /api/wallet/refund
router.post("/refund", async (req, res) => {
  try {
    if (!req.userId) return err(res, "UNAUTHENTICATED", 401);
    const txId = String(req.body?.txId || "").trim();
    if (!txId) return err(res, "BAD_REQUEST", 400, { field: "txId" });

    const tx = await WalletTransaction.findById(txId);
    if (!tx) return err(res, "TX_NOT_FOUND", 404);
    if (String(tx.userId) !== String(req.userId)) return err(res, "FORBIDDEN", 403);
    if (tx.type !== "deduct") return err(res, "NOT_REFUNDABLE", 400);

    const existing = await WalletTransaction.findOne({ userId: req.userId, type: "refund", note: `refund for ${txId}` });
    if (existing) return err(res, "ALREADY_REFUNDED", 409);

    const refund = await WalletTransaction.createRefund(req.userId, tx.amount, tx.storyId || null, `refund for ${txId}`);
    const updated = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { "wallet.balance": tx.amount } },
      { new: true }
    );

    // Log wallet refund event
    await logWalletEvent(eventTypes.WALLET_REFUND, req.userId, {
      amount: tx.amount,
      provider: "api",
      txId: String(refund._id)
    });

    return ok(res, { balance: updated?.wallet?.balance ?? 0, refundTxId: refund._id });
  } catch (err) {
    return err(res, "SERVER_ERROR", 500);
  }
});

export default router;


