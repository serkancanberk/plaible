// Production-safe error handling middleware
// Maintains existing { ok: true } / { error: "CODE" } response standard

import { logError } from '../services/logging.js';

/**
 * Attach a unique request ID to each request for tracing
 */
export function attachRequestId(req, res, next) {
  // Generate short request id
  const rid = (crypto?.randomUUID?.() || `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`);
  req.requestId = rid;
  res.locals.requestId = rid;
  return next();
}

/**
 * Handle 404s for API routes only
 */
export function notFoundHandler(req, res, next) {
  // Only handle /api/* here; non-api can fall back to default
  if (req.originalUrl?.startsWith("/api/")) {
    return res.status(404).json({ error: "NOT_FOUND", requestId: res.locals.requestId });
  }
  return next();
}

/**
 * Global error handler for unexpected errors
 */
export function globalErrorHandler(err, req, res, next) {
  // If headers already sent, delegate to Express default
  if (res.headersSent) return next(err);

  // Honor explicit status if present; mask 5xx to SERVER_ERROR
  const status = (err && typeof err.status === "number") ? err.status : 500;

  if (status >= 500) {
    // Use structured logging with stack trace (not leaked to client)
    logError('Server error occurred', {
      requestId: res.locals.requestId,
      userId: req.userId || null,
      method: req.method,
      path: req.originalUrl || req.url,
      status,
      meta: {
        message: err?.message,
        stack: err?.stack,
      }
    });
    return res.status(500).json({ error: "SERVER_ERROR", requestId: res.locals.requestId });
  }

  // For 4xx unexpected (rare): provide code or fallback
  const code = (err && err.code) || "BAD_REQUEST";
  return res.status(status).json({ error: code, requestId: res.locals.requestId });
}
