export type JsonInit = RequestInit & { timeoutMs?: number };

export async function fetchJson<T>(url: string, init: JsonInit = {}, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timeout = init.timeoutMs ? setTimeout(() => controller.abort(), init.timeoutMs) : undefined;
  const combinedSignal = mergeSignals(signal, controller.signal);

  try {
    try {
      if (init?.method && ['POST','PATCH'].includes(String(init.method).toUpperCase())) {
        let payload: any = undefined;
        try { payload = init?.body ? JSON.parse(String(init.body)) : undefined; } catch { payload = init?.body; }
        console.log('[PHASE4D_FE] REQUEST', { url, method: init.method, payload });
        try {
          (window as any).traceCollector = (window as any).traceCollector || [];
          (window as any).traceCollector.push({ ts: new Date().toISOString(), tag: '[PHASE4E_FE_REQUEST]', url, method: init.method, payload });
        } catch {}
      }
    } catch {}
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      signal: combinedSignal,
      credentials: init.credentials ?? 'include',
    });

    if (!res.ok) {
      let message = res.statusText;
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      const error = new Error(`HTTP ${res.status}: ${message}`);
      (error as any).status = res.status;
      try { console.log('[PHASE4D_FE] RESPONSE', { url, status: res.status, body: message }); } catch {}
      try {
        (window as any).traceCollector = (window as any).traceCollector || [];
        (window as any).traceCollector.push({ ts: new Date().toISOString(), tag: '[PHASE4E_FE_RESPONSE]', url, status: res.status, body: message });
      } catch {}
      throw error;
    }
    const data = await res.json();
    try { console.log('[PHASE4D_FE] RESPONSE', { url, status: res.status, body: data }); } catch {}
    try {
      (window as any).traceCollector = (window as any).traceCollector || [];
      (window as any).traceCollector.push({ ts: new Date().toISOString(), tag: '[PHASE4E_FE_RESPONSE]', url, status: res.status, body: data });
    } catch {}
    return data as T;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

// Phase 5.A: export combined traces (frontend + backend) via a global function
try {
  (window as any).exportTrace = async function exportTrace() {
    try {
      const resp = await fetch('/api/diagnostics/trace');
      const beTrace = await resp.json().catch(() => ({ trace: [] }));
      const fullTrace = { frontend: (window as any).traceCollector || [], backend: beTrace?.trace || [] };
      const blob = new Blob([JSON.stringify(fullTrace, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'trace.json';
      link.click();
    } catch (e) {
      console.error('exportTrace failed', e);
    }
  };
  console.log('[PHASE4E] Call window.exportTrace() to download full JSON trace');
} catch {}

function mergeSignals(a?: AbortSignal, b?: AbortSignal): AbortSignal | undefined {
  if (!a && !b) return undefined;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a?.addEventListener('abort', onAbort);
  b?.addEventListener('abort', onAbort);
  if (a?.aborted || b?.aborted) controller.abort();
  return controller.signal;
}


