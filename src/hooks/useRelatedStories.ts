import React, { useState, useEffect } from 'react';
import { fetchJson } from '../lib/http';
import type { DBStoryListItem } from '../types/story';

export function useRelatedStories(slug: string | undefined) {
  const [stories, setStories] = useState<DBStoryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setStories([]);
      setLoading(false);
      setError(null);
      return;
    }

    const ac = new AbortController();
    
    (async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetchJson<{ items: DBStoryListItem[] }>(
          `/api/stories/${slug}/related`, 
          { signal: ac.signal }
        );
        setStories(res.items ?? []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        console.error('[useRelatedStories] error:', e);
        setError(e?.message ?? "Failed to load related stories");
        setStories([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [slug]);

  return { stories, loading, error };
}
