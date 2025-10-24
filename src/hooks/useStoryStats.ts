import { useEffect, useState } from 'react';
import { fetchJson } from '../lib/http';

export interface StoryStats {
  totalPlays: number;
  totalReviews: number;
  averageRating: number;
}

export const useStoryStats = (slug: string | undefined) => {
  const [stats, setStats] = useState<StoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchJson<StoryStats>(`/api/stories/${slug}/stats`)
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error('Failed to fetch story stats:', err);
        setError(err.message || 'Failed to load statistics');
        // Set fallback values
        setStats({
          totalPlays: 0,
          totalReviews: 0,
          averageRating: 0,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  return { stats, loading, error };
};
