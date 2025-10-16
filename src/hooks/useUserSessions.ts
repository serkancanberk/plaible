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

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[FETCH] GET /api/sessions');
      const res = await fetch('/api/sessions', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = await res.json();
      const items: UserSessionItem[] = Array.isArray(data.items) ? data.items : [];
      console.log('[FETCH_RESULT] /api/sessions count=', items.length);
      // Sort by updatedAt desc
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setSessions(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Intentionally not auto-fetching; let caller control when user is ready
  }, []);

  return { sessions, loading, error, fetchSessions };
};


