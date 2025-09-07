// Structured logging service with single-line JSON output
// Production-safe with optional development pretty-printing

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Base logging function that formats all logs as single-line JSON
 */
function log(level, msg, meta = {}) {
  const logEntry = {
    level,
    ts: new Date().toISOString(),
    requestId: meta.requestId || null,
    userId: meta.userId || null,
    method: meta.method || null,
    path: meta.path || null,
    status: meta.status || null,
    durationMs: meta.durationMs || null,
    msg,
    meta: meta.meta || {}
  };

  // Remove null values to keep logs clean
  Object.keys(logEntry).forEach(key => {
    if (logEntry[key] === null) {
      delete logEntry[key];
    }
  });

  const jsonLine = JSON.stringify(logEntry);

  if (isDevelopment) {
    // In development, also pretty-print for easier debugging
    console.debug(`[${level.toUpperCase()}] ${msg}`);
    console.debug(JSON.stringify(logEntry, null, 2));
  } else {
    // In production, only single-line JSON
    console.log(jsonLine);
  }
}

/**
 * Log an info message
 */
export function logInfo(msg, meta = {}) {
  log('info', msg, meta);
}

/**
 * Log a warning message
 */
export function logWarn(msg, meta = {}) {
  log('warn', msg, meta);
}

/**
 * Log an error message
 */
export function logError(msg, meta = {}) {
  log('error', msg, meta);
}
