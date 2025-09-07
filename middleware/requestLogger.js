// Request logging middleware that logs structured JSON for each HTTP request
// Measures duration and captures request/response metadata

import { logInfo } from '../services/logging.js';

/**
 * Request logging middleware
 * Logs one structured JSON line per request with timing and metadata
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Capture request metadata
  const requestMeta = {
    requestId: req.requestId || null,
    userId: req.userId || null,
    method: req.method,
    path: req.originalUrl || req.url,
  };

  // Override res.end to capture response metadata
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const durationMs = Date.now() - startTime;
    
    // Log the request with response metadata
    logInfo('HTTP request completed', {
      ...requestMeta,
      status: res.statusCode,
      durationMs,
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
}
