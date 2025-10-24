import * as React from "react";
import { fetchJson } from "../lib/http";

interface FeedbackApiResponse {
  _id: string;
  stars: number;
  text: string;
  createdAt: string;
  weeksAgo: number;
  user: {
    username: string;
    fullName: string;
    profilePictureUrl?: string;
    city?: string;
  };
}

export interface FeedbackData {
  id: string;
  username: string;
  city: string;
  character: string;
  rating: number;
  weeksAgo: number;
  text: string;
  characterImageUrl?: string;
}

function transformFeedbackData(apiFeedback: FeedbackApiResponse): FeedbackData {
  return {
    id: apiFeedback._id,
    username: apiFeedback.user.username,
    city: apiFeedback.user.city || "Unknown Location",
    character: "Unknown Character", // fallback (not in backend)
    rating: apiFeedback.stars,
    weeksAgo: apiFeedback.weeksAgo,
    text: apiFeedback.text,
    characterImageUrl: apiFeedback.user.profilePictureUrl,
  };
}

export function useFeedbacksByStorySlug(slug: string | undefined, filterStars?: number) {
  const [data, setData] = React.useState<FeedbackData[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState<boolean>(true);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  const fetchFeedbacks = React.useCallback(async (reset = false) => {
    if (!slug || loading) return;

    setLoading(true);
    setError(undefined);

    try {
      const query = new URLSearchParams();
      if (cursor && !reset) query.set("cursor", cursor);
      if (filterStars) query.set("stars", String(filterStars));

      const response = await fetchJson<{ ok: boolean; items: FeedbackApiResponse[]; nextCursor?: string }>(
        `/api/feedbacks/story/${slug}?limit=5&${query.toString()}`
      );

      const newFeedbacks = response.items.map(transformFeedbackData);
      setData(prev => reset ? newFeedbacks : [...prev, ...newFeedbacks]);
      setCursor(response.nextCursor || null);
      setHasMore(Boolean(response.nextCursor));
    } catch (err) {
      if ((err as any)?.name === "AbortError") return;
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [slug, cursor, filterStars, loading]);

  // Reset data when slug or filter changes
  React.useEffect(() => {
    if (!slug) {
      setData([]);
      setCursor(null);
      setHasMore(true);
      setLoading(false);
      setError(undefined);
      return;
    }

    // Reset pagination state and fetch first page
    setData([]);
    setCursor(null);
    setHasMore(true);
    fetchFeedbacks(true);
  }, [slug, filterStars]);

  return { data, loading, error, hasMore, fetchFeedbacks } as const;
}
