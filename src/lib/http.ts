export type JsonInit = RequestInit & { timeoutMs?: number };

export async function fetchJson<T>(url: string, init: JsonInit = {}, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timeout = init.timeoutMs ? setTimeout(() => controller.abort(), init.timeoutMs) : undefined;
  const combinedSignal = mergeSignals(signal, controller.signal);

  try {
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
      throw error;
    }

    return res.json() as Promise<T>;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function mergeSignals(a?: AbortSignal, b?: AbortSignal): AbortSignal | undefined {
  if (!a && !b) return undefined;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a?.addEventListener('abort', onAbort);
  b?.addEventListener('abort', onAbort);
  if (a?.aborted || b?.aborted) controller.abort();
  return controller.signal;
}


