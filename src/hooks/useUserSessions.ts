import { useEffect, useState, useCallback } from 'react';

export interface UserSessionItem {
  _id: string;
  story: { title: string; slug: string };
  progress: { chapter: number; completed: boolean };
  updatedAt: string;
}

export const useUserSessions = () => {
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearSessions = useCallback(() => {
    setSessions([]);
  }, []);

  const fetchSessions = useCallback(async (email?: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[USE_USER_SESSIONS] fetchSessions invoked for', email || 'unknown');
      console.log('[VERIFY_ISOLATION_FETCH_START] email=', email || 'unknown');
      // Clear any previous local data to avoid ghost lists
      setSessions([]);
      console.log('[FETCH_CALL] /api/sessions invoked with credentials=include');
      const res = await fetch('/api/sessions', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = await res.json();
      const items: UserSessionItem[] = Array.isArray(data.items) ? data.items : [];
      console.log('[FETCH_RESULT] /api/sessions count=', items.length);
      console.log('[VERIFY_ISOLATION_FETCH_DONE] count=', items.length);
      // Sort by updatedAt desc
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setSessions(items);
    } catch (e) {
      console.log('[FETCH_ERROR]', e);
      setError(e instanceof Error ? e.message : 'Failed to load sessions');
    } finally {
      console.log('[USE_USER_SESSIONS] fetchSessions finished');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('[USE_USER_SESSIONS] Hook mounted');
    // Intentionally not auto-fetching; let caller control when user is ready
  }, []);

  return { sessions, loading, error, fetchSessions, clearSessions };
};


