exports.cleanText = (s, max = 2000) =>
  String(s || "").replace(/\s+/g," ").trim().slice(0, max);
