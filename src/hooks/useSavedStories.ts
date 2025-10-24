import { useAuth } from './useAuth';

export interface SavedStoryItem {
  slug: string;
  title: string;
  coverUrl?: string;
  createdAt: string;
}

// Phase 2: Unified state - useSavedStories reads from unified AuthProvider state
export const useSavedStories = () => {
  const { savedStories } = useAuth(); // Direct access to unified state
  
  console.log('[SAVED_STATE][UNIFIED]', { 
    action: 'useSavedStories_hook', 
    count: savedStories.length,
    source: 'unified_state',
    timestamp: new Date().toISOString()
  });
  
  // No local state, no individual API calls - everything centralized
  return { 
    savedStories, 
    loading: false, 
    error: null, 
    fetchSavedStories: () => {}, // No-op, handled by AuthProvider
    clearSaved: () => {} // No-op, handled by AuthProvider
  };
};


