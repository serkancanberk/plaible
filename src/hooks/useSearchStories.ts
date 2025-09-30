import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchJson } from '../lib/http';
import type { DBStoryListItem, StoriesListResponse } from '../types/story';

export interface UseSearchStoriesReturn {
  results: DBStoryListItem[];
  loading: boolean;
  error?: Error;
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 5;

export function useSearchStories(query: string, debounceMs: number = 300): UseSearchStoriesReturn {
  const [results, setResults] = useState<DBStoryListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch (err) {
      console.error('Failed to load recent searches from localStorage:', err);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't search if query is too short
    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError(undefined);
      return;
    }

    // Set loading state
    setLoading(true);
    setError(undefined);

    // Debounce the search
    timeoutRef.current = setTimeout(async () => {
      try {
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        
        const searchQuery = query.trim();
        const url = `/api/stories?search=${encodeURIComponent(searchQuery)}`;
        
        console.log('[useSearchStories] searching:', { query: searchQuery, url });
        
        const response = await fetchJson<StoriesListResponse>(
          url,
          {},
          abortControllerRef.current.signal
        );

        if (response.items) {
          setResults(response.items);
        } else {
          setResults([]);
        }
        setError(undefined);
      } catch (err) {
        // Don't set error if request was aborted
        if ((err as any)?.name !== 'AbortError') {
          console.error('[useSearchStories] search failed:', err);
          setError(err as Error);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, debounceMs]);

  // Add recent search function
  const addRecentSearch = useCallback((term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) return;

    setRecentSearches(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item !== trimmedTerm);
      // Add to beginning
      const updated = [trimmedTerm, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      // Persist to localStorage
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save recent searches to localStorage:', err);
      }
      
      return updated;
    });
  }, []);

  // Clear recent searches function
  const clearRecentSearches = useCallback(() => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error("Failed to clear recent searches:", e);
    }
    setRecentSearches([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
}
