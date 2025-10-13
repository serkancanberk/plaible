import React from 'react';
import { fetchJson } from '../lib/http';

// Types for fun facts
export type FactItem = { title: string; description: string };

export type FunFacts = {
  storyFacts: FactItem[];
  authorInfo: FactItem[];
  modernEcho: FactItem[];
};

export interface StoryData {
  _id: string;
  slug: string;
  title: string;
  authorName: string;
  genres: string[];
  publishedYear: number;
  stats: {
    totalPlayed: number;
    avgRating: number;
  };
  headline: string;
  description: string;
  hooks?: string[];
  summary: {
    original: string;
    modern: string;
    highlights: Array<{
      title: string;
      description: string;
    }>;
  };
  characters?: Array<{
    id: string;
    name: string;
    summary: string;
    hooks: string[];
    assets: {
      images: string[];
      videos: string[];
    };
    roles?: string[];
    helloMessage?: string;
    onboardingText?: string;
  }>;
  funFacts?: FunFacts;
}

export function useStoryBySlug(slug: string | undefined) {
  const [data, setData] = React.useState<StoryData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  React.useEffect(() => {
    if (!slug) {
      setData(null);
      setLoading(false);
      setError(undefined);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(undefined);

    fetchJson<StoryData>(`/api/stories/${slug}`, {}, controller.signal)
      .then((story) => {
        setData(story);
        setError(undefined);
      })
      .catch((err) => {
        if ((err as any)?.name === 'AbortError') return;
        setError(err as Error);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [slug]);

  return { data, loading, error } as const;
}
