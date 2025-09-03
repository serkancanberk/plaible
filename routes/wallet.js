import { Router } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { WalletTransaction } from "../models/WalletTransaction.js";

const router = Router();

function parsePositiveInt(v, min = 1, max = 100000) {
  const num = Number(v);
  if (!Number.isInteger(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

// 1) GET /api/wallet/me
router.get("/me", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "UNAUTHENTICATED" });
    const user = await User.findById(req.userId).lean();
    const balance = user?.wallet?.balance ?? 0;
    return res.json({ balance });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// 2) GET /api/wallet/transactions?limit=20&cursor=<createdAt_iso>
router.get("/transactions", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "UNAUTHENTICATED" });
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
    return res.json(nextCursor ? { items, nextCursor } : { items });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// 3) POST /api/wallet/topup
router.post("/topup", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "UNAUTHENTICATED" });
    const amount = parsePositiveInt(req.body?.amount);
    if (!amount) {
      return res.status(400).json({ error: "BAD_REQUEST", field: "amount" });
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
    if (!updated) return res.status(404).json({ error: "USER_NOT_FOUND" });
    const balance = updated.wallet?.balance ?? 0;
    return res.json({ ok: true, balance, txId: tx._id });
  } catch (err) {
    // In the catch, log the error before returning
    console.error("[wallet/topup] error", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// 4) POST /api/wallet/deduct
router.post("/deduct", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "UNAUTHENTICATED" });
    const amount = parsePositiveInt(req.body?.amount);
    if (!amount) {
      return res.status(400).json({ error: "BAD_REQUEST", field: "amount" });
    }
    const storyId = typeof req.body?.storyId === "string" ? req.body.storyId : null;
    const chapter = Number.isInteger(req.body?.chapter) ? req.body.chapter : null;

    const user = await User.findById(req.userId);
    const balance = user?.wallet?.balance ?? 0;
    if (balance < amount) {
      return res.status(402).json({ error: "INSUFFICIENT_CREDITS", balance });
    }

    try {
      const tx = await WalletTransaction.createDeduct(req.userId, amount, storyId, chapter, "deduct:api");
      const updated = await User.findByIdAndUpdate(
        req.userId,
        { $inc: { "wallet.balance": -amount } },
        { new: true }
      );
      return res.json({ ok: true, balance: updated?.wallet?.balance ?? 0, txId: tx._id });
    } catch (e) {
      if (process.env.NODE_ENV === "development" && process.env.AUTH_DEBUG === "1") {
        console.warn("[wallet] WARN non-transactional path:", e?.message);
      }
      // Fallback already sequential above
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// 5) POST /api/wallet/refund
router.post("/refund", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "UNAUTHENTICATED" });
    const txId = String(req.body?.txId || "").trim();
    if (!txId) return res.status(400).json({ error: "BAD_REQUEST", field: "txId" });

    const tx = await WalletTransaction.findById(txId);
    if (!tx) return res.status(404).json({ error: "TX_NOT_FOUND" });
    if (String(tx.userId) !== String(req.userId)) return res.status(403).json({ error: "FORBIDDEN" });
    if (tx.type !== "deduct") return res.status(400).json({ error: "NOT_REFUNDABLE" });

    const existing = await WalletTransaction.findOne({ userId: req.userId, type: "refund", note: `refund for ${txId}` });
    if (existing) return res.status(409).json({ error: "ALREADY_REFUNDED" });

    const refund = await WalletTransaction.createRefund(req.userId, tx.amount, tx.storyId || null, `refund for ${txId}`);
    const updated = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { "wallet.balance": tx.amount } },
      { new: true }
    );

    return res.json({ ok: true, balance: updated?.wallet?.balance ?? 0, refundTxId: refund._id });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

export default router;


