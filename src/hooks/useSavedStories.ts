import { useEffect, useState, useCallback } from 'react';

export interface SavedStoryItem {
  slug: string;
  title: string;
  coverUrl?: string;
  createdAt: string;
}

export const useSavedStories = () => {
  const [savedStories, setSavedStories] = useState<SavedStoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedStories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[FETCH] GET /api/saves');
      const res = await fetch('/api/saves', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load saved stories');
      const data = await res.json();
      const items: SavedStoryItem[] = Array.isArray(data.items) ? data.items : [];
      console.log('[FETCH_RESULT] /api/saves count=', items.length);
      // Sort by createdAt desc
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSavedStories(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load saved stories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Intentionally not auto-fetching; let caller control when user is ready
  }, []);

  return { savedStories, loading, error, fetchSavedStories };
};


