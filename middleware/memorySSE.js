// In-memory SSE registry for real-time play loop updates
// Hardened liveness checks + heartbeat + safe cleanup

const clients = new Map(); // sessionId -> Set<ServerResponse>
const heartbeatInterval = 25000; // 25 seconds

function isDead(res) {
  // Do NOT use headersSent here; it's true for healthy SSE connections after writeHead
  return !!(res.writableEnded || res.destroyed || res.socket?.destroyed);
}

// Cleanup function to remove dead connections
function cleanupDeadConnections() {
  for (const [sessionId, clientSet] of clients.entries()) {
    const dead = [];
    for (const res of clientSet) {
      if (isDead(res)) dead.push(res);
    }
    dead.forEach(res => clientSet.delete(res));
    if (clientSet.size === 0) clients.delete(sessionId);
  }
}

// Heartbeat to keep connections alive
setInterval(() => {
  cleanupDeadConnections();

  const payload = { kind: 'heartbeat', ts: new Date().toISOString() };
  const frame = `data: ${JSON.stringify(payload)}\n\n`;

  for (const [sessionId, clientSet] of clients.entries()) {
    const dead = [];
    for (const res of clientSet) {
      try {
        if (!isDead(res)) {
          res.write(frame);
        } else {
          dead.push(res);
        }
      } catch {
        dead.push(res);
      }
    }
    dead.forEach(res => clientSet.delete(res));
    if (clientSet.size === 0) clients.delete(sessionId);
  }
}, heartbeatInterval);

/**
 * Add a client to the SSE registry for a session
 */
export function addClient(sessionId, res) {
  if (!clients.has(sessionId)) clients.set(sessionId, new Set());
  clients.get(sessionId).add(res);

  // Proper SSE headers; do NOT set Access-Control-Allow-Origin here
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Helpful with some proxies
  if (typeof res.flushHeaders === 'function') {
    try { res.flushHeaders(); } catch {}
  }

  const onClose = () => removeClient(sessionId, res);
  res.on('close', onClose);
  res.on('error', onClose);
}

/**
 * Remove a client from the SSE registry
 */
export function removeClient(sessionId, res) {
  const set = clients.get(sessionId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(sessionId);
}

/**
 * Emit a message to all clients connected to a session
 */
export function emit(sessionId, payload) {
  const set = clients.get(sessionId);
  if (!set || set.size === 0) return;

  const frame = `data: ${JSON.stringify(payload)}\n\n`;
  const dead = [];

  for (const res of set) {
    try {
      if (!isDead(res)) {
        res.write(frame);
      } else {
        dead.push(res);
      }
    } catch {
      dead.push(res);
    }
  }

  dead.forEach(res => set.delete(res));
  if (set.size === 0) clients.delete(sessionId);
}