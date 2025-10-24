const buckets = new Map();
module.exports = (keyPrefix, limit=10, windowMs=60_000) => (req,res,next)=>{
  const key = keyPrefix + ":" + (req.ip || req.headers['x-forwarded-for'] || 'ip');
  const now = Date.now();
  const arr = buckets.get(key)?.filter(t => now - t < windowMs) || [];
  if (arr.length >= limit) return res.status(429).json({ ok:false, error:"RATE_LIMIT" });
  arr.push(now); buckets.set(key, arr); next();
};
