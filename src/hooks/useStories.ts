import React from 'react';
import { fetchJson } from '../lib/http';
import type { StoriesListResponse, DBStoryListItem } from '../types/story';

export type UseStoriesParams = {
  page?: number;
  pageSize?: number;
  sort?: string;
  category?: string;
  subcategory?: string;
};

export function useStories(params: UseStoriesParams = {}) {
  const { page = 1, pageSize = 9, sort, category, subcategory } = params;
  const [data, setData] = React.useState<DBStoryListItem[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  const fetchParams = React.useMemo(() => ({ page, pageSize, sort, category, subcategory }), [page, pageSize, sort, category, subcategory]);

  React.useEffect(() => {
    const controller = new AbortController();
    const url = buildStoriesUrl('/api/stories', fetchParams);
    setLoading(true);
    setError(undefined);

    fetchJson<StoriesListResponse>(url, {}, controller.signal)
      .then((json) => {
        setData(json.items || []);
        setTotal(json.total || (json.items ? json.items.length : 0));
      })
      .catch((err) => {
        if ((err as any)?.name === 'AbortError') return;
        setError(err as Error);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [fetchParams]);

  const refetch = React.useCallback(() => {
    // Trigger useEffect by changing a stable key; here we change page to same value via state trick not kept locally
    // Consumers should update page/sort params to refetch; this is a placeholder for API parity.
  }, []);

  return { data, total, page, pageSize, loading, error, refetch } as const;
}

function buildStoriesUrl(base: string, params: Record<string, unknown>) {
  const url = new URL(base, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}


