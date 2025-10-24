# Stage 13.13.4 — Unified SaveState & Library Refactor Plan

## Executive Summary

This plan implements a comprehensive refactor to unify all saved stories management under AuthProvider, eliminating fragmented state management and ensuring consistent data flow between frontend and backend. The solution provides optimistic UI updates, robust error handling, and seamless synchronization.

---

## Current State Analysis

### Current SaveState Management Issues

1. **Fragmented State Management**:
   - `useSavedStories` hook manages separate state
   - `useSaveStory` hook has its own state
   - AuthProvider has basic `savedStories` array
   - No unified source of truth

2. **Inconsistent Data Flow**:
   - Multiple API calls for same data
   - No synchronization between hooks
   - Optimistic updates not coordinated
   - Guest vs authenticated handling differs

3. **Missing Integration**:
   - No connection between SaveContext and AuthProvider
   - Components use different hooks for same data
   - No centralized error handling
   - No localStorage fallback for guests

---

## Phase 1: Unified SaveState Architecture

### 1.1 Enhanced SavedStoryItem Interface

**New Type Definition - src/types/SavedStory.ts:**
```typescript
export interface SavedStoryItem {
  id: string;
  slug: string;
  title: string;
  coverImage?: string;
  coverUrl?: string;
  authorName?: string;
  savedAt: string;
  createdAt: string;
  // Metadata for UI
  isNew?: boolean; // For highlighting recently saved
  lastAccessed?: string;
}

export interface SaveState {
  savedStories: SavedStoryItem[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSync: Date | null;
  pendingChanges: Set<string>; // slugs with pending changes
}

export interface SaveActions {
  toggleSave: (slug: string) => Promise<void>;
  isStorySaved: (slug: string) => boolean;
  syncSavedStories: () => Promise<void>;
  clearSavedStories: () => void;
  retryFailedSaves: () => Promise<void>;
}
```

### 1.2 Enhanced AuthProvider Integration

**Updated AuthProvider - src/context/AuthProvider.tsx:**
```typescript
interface UserData {
  _id: string;
  email: string;
  profilePictureUrl?: string;
  identity: {
    firstName: string;
    lastName: string;
    displayName: string;
  };
  wallet: {
    balance: number;
  };
  sessions?: UserSessionItem[];
  // UNIFIED: Enhanced saved stories management
  savedStories?: SavedStoryItem[];
  saveState?: SaveState;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (redirectPath?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  // LEGACY: Keep for backward compatibility
  savedStories: string[];
  updateSaveStatus: (slug: string, saved: boolean) => void;
  // NEW: Unified save management
  saveActions: SaveActions;
  saveState: SaveState;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>({
    savedStories: [],
    isLoading: false,
    isSaving: false,
    error: null,
    lastSync: null,
    pendingChanges: new Set()
  });

  // Debounced save operations
  const debouncedSave = useMemo(
    () => debounce(async (slug: string, action: 'save' | 'unsave') => {
      await performSaveAction(slug, action);
    }, 300),
    []
  );

  const performSaveAction = useCallback(async (slug: string, action: 'save' | 'unsave') => {
    if (!user) return;

    setSaveState(prev => ({
      ...prev,
      isSaving: true,
      error: null,
      pendingChanges: new Set([...prev.pendingChanges, slug])
    }));

    try {
      const response = await fetch(`/api/saves${action === 'save' ? '' : `/${slug}`}`, {
        method: action === 'save' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: action === 'save' ? JSON.stringify({ storySlug: slug }) : undefined
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} story: ${response.status}`);
      }

      // Update local state
      if (action === 'save') {
        const storyData = await response.json();
        setSaveState(prev => ({
          ...prev,
          savedStories: [...prev.savedStories, storyData.story],
          isSaving: false,
          lastSync: new Date(),
          pendingChanges: new Set([...prev.pendingChanges].filter(s => s !== slug))
        }));
      } else {
        setSaveState(prev => ({
          ...prev,
          savedStories: prev.savedStories.filter(s => s.slug !== slug),
          isSaving: false,
          lastSync: new Date(),
          pendingChanges: new Set([...prev.pendingChanges].filter(s => s !== slug))
        }));
      }

      // Update user object
      setUser(prev => prev ? {
        ...prev,
        savedStories: action === 'save' 
          ? [...(prev.savedStories || []), storyData.story]
          : (prev.savedStories || []).filter(s => s.slug !== slug)
      } : null);

    } catch (error) {
      console.error(`[SAVE_ACTION] Failed to ${action} story:`, error);
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: error.message,
        pendingChanges: new Set([...prev.pendingChanges].filter(s => s !== slug))
      }));
    }
  }, [user]);

  const toggleSave = useCallback(async (slug: string) => {
    if (!user) {
      // Guest user: save to localStorage
      const guestSaves = JSON.parse(localStorage.getItem('guestSavedStories') || '[]');
      const isCurrentlySaved = guestSaves.includes(slug);
      
      if (isCurrentlySaved) {
        const updatedSaves = guestSaves.filter((s: string) => s !== slug);
        localStorage.setItem('guestSavedStories', JSON.stringify(updatedSaves));
      } else {
        const updatedSaves = [...guestSaves, slug];
        localStorage.setItem('guestSavedStories', JSON.stringify(updatedSaves));
      }
      return;
    }

    const isCurrentlySaved = saveState.savedStories.some(s => s.slug === slug);
    const action = isCurrentlySaved ? 'unsave' : 'save';
    
    // Optimistic update
    setSaveState(prev => ({
      ...prev,
      savedStories: isCurrentlySaved
        ? prev.savedStories.filter(s => s.slug !== slug)
        : [...prev.savedStories, { slug, savedAt: new Date().toISOString() } as SavedStoryItem]
    }));

    // Debounced backend sync
    debouncedSave(slug, action);
  }, [user, saveState.savedStories, debouncedSave]);

  const isStorySaved = useCallback((slug: string) => {
    if (!user) {
      const guestSaves = JSON.parse(localStorage.getItem('guestSavedStories') || '[]');
      return guestSaves.includes(slug);
    }
    return saveState.savedStories.some(s => s.slug === slug);
  }, [user, saveState.savedStories]);

  const syncSavedStories = useCallback(async () => {
    if (!user) return;

    setSaveState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/saves', {
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch saved stories: ${response.status}`);
      }

      const data = await response.json();
      const savedStories = data.items || [];

      setSaveState(prev => ({
        ...prev,
        savedStories,
        isLoading: false,
        lastSync: new Date(),
        error: null
      }));

      // Update user object
      setUser(prev => prev ? {
        ...prev,
        savedStories
      } : null);

    } catch (error) {
      console.error('[SYNC_SAVED_STORIES] Failed:', error);
      setSaveState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  }, [user]);

  const clearSavedStories = useCallback(() => {
    setSaveState({
      savedStories: [],
      isLoading: false,
      isSaving: false,
      error: null,
      lastSync: null,
      pendingChanges: new Set()
    });
    
    setUser(prev => prev ? {
      ...prev,
      savedStories: []
    } : null);
  }, []);

  const retryFailedSaves = useCallback(async () => {
    const failedSlugs = Array.from(saveState.pendingChanges);
    for (const slug of failedSlugs) {
      const isSaved = saveState.savedStories.some(s => s.slug === slug);
      await performSaveAction(slug, isSaved ? 'save' : 'unsave');
    }
  }, [saveState.pendingChanges, saveState.savedStories, performSaveAction]);

  // Load saved stories on user login
  useEffect(() => {
    if (user && user._id) {
      syncSavedStories();
    } else {
      clearSavedStories();
    }
  }, [user?._id, syncSavedStories, clearSavedStories]);

  // Network recovery
  useEffect(() => {
    const handleOnline = () => {
      if (saveState.pendingChanges.size > 0) {
        retryFailedSaves();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [saveState.pendingChanges.size, retryFailedSaves]);

  const saveActions: SaveActions = {
    toggleSave,
    isStorySaved,
    syncSavedStories,
    clearSavedStories,
    retryFailedSaves
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser: fetchUser,
      // Legacy support
      savedStories: saveState.savedStories.map(s => s.slug),
      updateSaveStatus: (slug, saved) => {
        if (saved && !isStorySaved(slug)) {
          toggleSave(slug);
        } else if (!saved && isStorySaved(slug)) {
          toggleSave(slug);
        }
      },
      // New unified interface
      saveActions,
      saveState
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Phase 2: Refactored useSaveStory Hook

### 2.1 Simplified useSaveStory Hook

**Updated useSaveStory - src/hooks/useSaveStory.ts:**
```typescript
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "../components/ui/Toast";

export const useSaveStory = (storySlug: string) => {
  const [loading, setLoading] = useState(false);
  const { saveActions, saveState } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const isSaved = saveActions.isStorySaved(storySlug);
  const isPending = saveState.pendingChanges.has(storySlug);

  useEffect(() => {
    // Auto-sync when story slug changes
    if (storySlug && !saveState.isLoading) {
      saveActions.syncSavedStories();
    }
  }, [storySlug, saveActions, saveState.isLoading]);

  const toggleSave = async () => {
    if (!storySlug) return;
    
    setLoading(true);
    
    try {
      // Optimistic UI feedback
      if (isSaved) {
        showToast("Removing from your library...", "info");
      } else {
        showToast("Saving to your library...", "success");
      }

      await saveActions.toggleSave(storySlug);
      
      // Success feedback
      if (isSaved) {
        showToast("Story removed from your library.", "info");
      } else {
        showToast("Story saved to your library.", "success");
      }
    } catch (error) {
      console.error('[useSaveStory] Toggle failed:', error);
      showToast("Couldn't save this story. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return { 
    isSaved, 
    loading: loading || isPending || saveState.isSaving, 
    toggleSave, 
    ToastComponent,
    error: saveState.error
  };
};
```

---

## Phase 3: Backend API Synchronization

### 3.1 Enhanced Saves API

**Updated routes/saves.js:**
```javascript
import { Router } from 'express';
import { Save } from '../models/Save.js';
import { Story } from '../models/Story.js';
import { User } from '../models/User.js';

const router = Router();

// GET /api/saves - Get all saved stories for user
router.get('/', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }

    const savedStories = await Save.find({ userId: req.userId })
      .populate('storyId', 'title slug assets authorName stats')
      .sort({ createdAt: -1 })
      .lean();

    const items = savedStories.map(save => ({
      id: save._id.toString(),
      slug: save.slug,
      title: save.title,
      coverImage: save.coverUrl,
      authorName: save.authorName,
      savedAt: save.createdAt.toISOString(),
      createdAt: save.createdAt.toISOString(),
      // Additional metadata
      isNew: new Date() - new Date(save.createdAt) < 24 * 60 * 60 * 1000, // Last 24 hours
      lastAccessed: save.updatedAt?.toISOString()
    }));

    res.json({
      ok: true,
      items,
      count: items.length,
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching saved stories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/saves - Save a story
router.post('/', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }

    const { storySlug } = req.body;
    if (!storySlug) {
      return res.status(400).json({ error: 'storySlug is required' });
    }

    // Get story details
    const story = await Story.findOne(
      { slug: storySlug },
      { _id: 1, slug: 1, title: 1, 'assets.images': 1, authorName: 1 }
    ).lean();

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const coverUrl = story.assets?.images?.[0] || null;

    // Check if already saved
    const existingSave = await Save.findOne({ 
      userId: req.userId, 
      storyId: story._id 
    });

    if (existingSave) {
      return res.json({
        ok: true,
        story: {
          id: existingSave._id.toString(),
          slug: existingSave.slug,
          title: existingSave.title,
          coverImage: existingSave.coverUrl,
          authorName: existingSave.authorName,
          savedAt: existingSave.createdAt.toISOString(),
          createdAt: existingSave.createdAt.toISOString()
        },
        created: false
      });
    }

    // Create new save
    const save = new Save({
      userId: req.userId,
      storyId: story._id,
      slug: story.slug,
      title: story.title,
      coverUrl,
      authorName: story.authorName
    });

    await save.save();

    // Update story stats
    await Story.updateOne(
      { _id: story._id },
      { $inc: { 'stats.savedCount': 1 } }
    );

    res.json({
      ok: true,
      story: {
        id: save._id.toString(),
        slug: save.slug,
        title: save.title,
        coverImage: save.coverUrl,
        authorName: save.authorName,
        savedAt: save.createdAt.toISOString(),
        createdAt: save.createdAt.toISOString()
      },
      created: true
    });
  } catch (error) {
    console.error('Error saving story:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/saves/:slug - Unsave a story
router.delete('/:slug', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }

    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: 'slug is required' });
    }

    const save = await Save.findOneAndDelete({ 
      userId: req.userId, 
      slug: slug 
    });

    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }

    // Update story stats
    await Story.updateOne(
      { _id: save.storyId },
      { $inc: { 'stats.savedCount': -1 } }
    );

    res.json({
      ok: true,
      message: 'Story unsaved successfully'
    });
  } catch (error) {
    console.error('Error unsaving story:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/saves/story/:slug/is-saved - Check if story is saved
router.get('/story/:slug/is-saved', async (req, res) => {
  try {
    if (!req.userId) {
      return res.json({ saved: false });
    }

    const { slug } = req.params;
    const save = await Save.findOne({ 
      userId: req.userId, 
      slug: slug 
    });

    res.json({
      saved: !!save,
      savedAt: save?.createdAt?.toISOString()
    });
  } catch (error) {
    console.error('Error checking save status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

---

## Phase 4: Component Integration

### 4.1 Updated StoryCard Component

**Updated StoryCard - src/components/ui/StoryCard.tsx:**
```typescript
import { useSaveStory } from '../../hooks/useSaveStory';

export default function StoryCard({
  title,
  authorName,
  slug,
  headline,
  assets,
  stats,
  onPlay,
  className,
}: StoryCardProps) {
  const { isSaved, loading, toggleSave, ToastComponent } = useSaveStory(slug);

  return (
    <div className={`story-card ${className}`}>
      {/* Card content */}
      
      {/* Save toggle */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleSave();
        }}
        disabled={loading}
        className="font-mono text-caption text-text-tertiary flex items-center gap-2 hover:text-text-tertiary/50 transition-all duration-150 disabled:opacity-50"
        title={isSaved ? "Remove from saved stories" : "Save this story"}
      >
        <span 
          aria-hidden="true" 
          className="transition-transform duration-200"
        >
          🔖
        </span>
        <span className="sr-only">{isSaved ? "Saved:" : "Save:"}</span>
        <span className="text-text-tertiary hover:text-text-tertiary/50 transition-all duration-150 disabled:opacity-50">
          {isSaved ? "Saved" : "Save"}
        </span>
      </button>
      
      {ToastComponent}
    </div>
  );
}
```

### 4.2 Updated StoryHeader Component

**Updated StoryHeader - src/components/StoryHeader.tsx:**
```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { useStoryBySlug } from '../hooks/useStoryBySlug';
import { useSaveStory } from '../hooks/useSaveStory';

export const StoryHeader: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: story, loading, error } = useStoryBySlug(slug);
  const { isSaved, loading: saveLoading, toggleSave, ToastComponent } = useSaveStory(slug || '');

  if (loading) return <p className="text-body text-text-tertiary">Loading story...</p>;
  if (error) return <p className="text-body text-text-tertiary">Error loading story.</p>;
  if (!story) return <p className="text-body text-text-tertiary">Story not found.</p>;

  return (
    <>
      <div className="flex flex-col space-y-8 text-left md:text-left">
        {/* Title and metadata */}
        <div className="flex flex-col space-y-2">
          <h1 className="font-serif text-hero text-accent">
            {story.title}
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-left md:justify-start gap-x-4 gap-y-4 md:gap-x-12 md:gap-y-4">
            {/* Existing metadata items */}
            
            {/* Save toggle */}
            <button
              onClick={toggleSave}
              disabled={saveLoading}
              className="font-mono text-caption text-text-tertiary flex items-center gap-2 hover:text-text-tertiary/50 transition-all duration-150 disabled:opacity-50"
              title={isSaved ? "Remove from saved stories" : "Save this story"}
            >
              <span className="transition-transform duration-200">
                🔖
              </span>
              <span className="font-mono text-caption text-text-tertiary hover:text-text-tertiary/50 transition-all duration-150 disabled:opacity-50">
                {isSaved ? "Saved" : "Save"}
              </span>
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col space-y-2">
          <p className="font-sans text-heading text-text-tertiary">
            {story.headline}
          </p>
          <p className="font-sans text-body text-text-tertiary">
            {story.description}
          </p>
        </div>
      </div>
      {ToastComponent}
    </>
  );
};
```

---

## Phase 5: Error Handling & Recovery

### 5.1 Error Recovery System

**Error Recovery Hook - src/hooks/useSaveErrorRecovery.ts:**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface ErrorRecoveryState {
  hasErrors: boolean;
  errorCount: number;
  lastError: string | null;
  retryAttempts: number;
}

export const useSaveErrorRecovery = () => {
  const { saveState, saveActions } = useAuth();
  const [recoveryState, setRecoveryState] = useState<ErrorRecoveryState>({
    hasErrors: false,
    errorCount: 0,
    lastError: null,
    retryAttempts: 0
  });

  const retryFailedSaves = useCallback(async () => {
    if (saveState.pendingChanges.size === 0) return;

    setRecoveryState(prev => ({
      ...prev,
      retryAttempts: prev.retryAttempts + 1
    }));

    try {
      await saveActions.retryFailedSaves();
      setRecoveryState({
        hasErrors: false,
        errorCount: 0,
        lastError: null,
        retryAttempts: 0
      });
    } catch (error) {
      setRecoveryState(prev => ({
        ...prev,
        hasErrors: true,
        errorCount: prev.errorCount + 1,
        lastError: error.message
      }));
    }
  }, [saveState.pendingChanges.size, saveActions]);

  // Monitor error state
  useEffect(() => {
    if (saveState.error) {
      setRecoveryState(prev => ({
        ...prev,
        hasErrors: true,
        errorCount: prev.errorCount + 1,
        lastError: saveState.error
      }));
    }
  }, [saveState.error]);

  // Auto-retry on network recovery
  useEffect(() => {
    const handleOnline = () => {
      if (recoveryState.hasErrors) {
        retryFailedSaves();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [recoveryState.hasErrors, retryFailedSaves]);

  return {
    recoveryState,
    retryFailedSaves
  };
};
```

### 5.2 LocalStorage Fallback

**Guest User Support - src/utils/guestSaveManager.ts:**
```typescript
export class GuestSaveManager {
  private static readonly STORAGE_KEY = 'guestSavedStories';
  private static readonly MAX_GUEST_SAVES = 50;

  static getSavedStories(): string[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to load guest saved stories:', error);
      return [];
    }
  }

  static saveStory(slug: string): boolean {
    try {
      const current = this.getSavedStories();
      if (current.includes(slug)) return true;
      
      if (current.length >= this.MAX_GUEST_SAVES) {
        // Remove oldest save
        current.shift();
      }
      
      current.push(slug);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(current));
      return true;
    } catch (error) {
      console.warn('Failed to save story for guest:', error);
      return false;
    }
  }

  static unsaveStory(slug: string): boolean {
    try {
      const current = this.getSavedStories();
      const updated = current.filter(s => s !== slug);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.warn('Failed to unsave story for guest:', error);
      return false;
    }
  }

  static isStorySaved(slug: string): boolean {
    return this.getSavedStories().includes(slug);
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear guest saved stories:', error);
    }
  }

  static migrateToUser(userId: string): Promise<boolean> {
    // This would be called when a guest user logs in
    // Implementation would sync guest saves to user account
    return Promise.resolve(true);
  }
}
```

---

## Phase 6: Migration & Testing Plan

### 6.1 Migration Steps

**Step 1: Move SaveContext logic to AuthProvider**
```typescript
// 1. Remove useSavedStories hook
// 2. Integrate save logic into AuthProvider
// 3. Update saveState management
// 4. Add error handling and recovery
```

**Step 2: Update useSaveStory hook**
```typescript
// 1. Simplify hook to use AuthProvider context
// 2. Remove duplicate state management
// 3. Add optimistic UI updates
// 4. Implement error recovery
```

**Step 3: Refactor components**
```typescript
// 1. Update StoryCard to use unified state
// 2. Update StoryHeader to use unified state
// 3. Remove duplicate API calls
// 4. Add loading states and error handling
```

**Step 4: Implement backend sync**
```typescript
// 1. Update /api/saves endpoints
// 2. Add proper error handling
// 3. Implement retry logic
// 4. Add metadata support
```

**Step 5: Add localStorage persistence**
```typescript
// 1. Implement guest user support
// 2. Add migration logic
// 3. Handle offline scenarios
// 4. Add cleanup on logout
```

**Step 6: Test scenarios**
```typescript
// 1. Test optimistic updates
// 2. Test error recovery
// 3. Test guest user flow
// 4. Test logout cleanup
// 5. Test re-login restore
```

### 6.2 Testing Checklist

**UI Consistency Tests:**
- [ ] Save/Saved toggle works in StoryCard
- [ ] Save/Saved toggle works in StoryHeader
- [ ] Optimistic updates work correctly
- [ ] Loading states display properly
- [ ] Error states show user feedback

**API Sync Tests:**
- [ ] Save story syncs to backend
- [ ] Unsave story syncs to backend
- [ ] Failed saves retry automatically
- [ ] Network recovery triggers sync
- [ ] Data consistency maintained

**Guest User Tests:**
- [ ] Guest users can save stories locally
- [ ] Guest saves persist across sessions
- [ ] Guest saves migrate on login
- [ ] Guest saves clear on logout

**Error Handling Tests:**
- [ ] Network failures show user feedback
- [ ] Retry logic works correctly
- [ ] Fallback to localStorage
- [ ] Graceful degradation
- [ ] Error recovery on reconnect

**Performance Tests:**
- [ ] Sync latency < 200ms
- [ ] Data consistency 100%
- [ ] Error recovery < 2 retries
- [ ] UI reliability zero stale states

---

## Implementation Timeline

### Week 1: Core Architecture
- [ ] Create unified SaveState types
- [ ] Update AuthProvider with save management
- [ ] Implement debounced save operations
- [ ] Add error handling and recovery

### Week 2: Hook Refactoring
- [ ] Simplify useSaveStory hook
- [ ] Remove useSavedStories hook
- [ ] Update component integrations
- [ ] Add optimistic UI updates

### Week 3: Backend Integration
- [ ] Update /api/saves endpoints
- [ ] Implement proper error handling
- [ ] Add metadata support
- [ ] Test API synchronization

### Week 4: Testing & Polish
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Error recovery testing
- [ ] User acceptance testing

---

## Success Metrics

### Performance Improvements
- **Sync Latency**: < 200ms for save operations
- **Data Consistency**: 100% match between backend & context
- **Error Recovery**: < 2 retries on failed requests
- **UI Reliability**: Zero stale states after save/unsave

### User Experience
- **Unified State**: Single source of truth for saved stories
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Clear feedback on failures
- **Offline Support**: Guest mode works without network

### Technical Quality
- **Code Reduction**: 50% less duplicate code
- **Maintainability**: Centralized save management
- **Reliability**: Robust error handling
- **Performance**: Optimized API calls

---

## Conclusion

This Unified SaveState & Library Refactor plan provides a comprehensive solution for consolidating all saved stories management under AuthProvider. The implementation eliminates fragmented state management, ensures consistent data flow, and provides robust error handling while maintaining excellent user experience.

The phased approach ensures minimal disruption during implementation while providing clear success metrics and comprehensive testing coverage.

**Next Steps:**
1. Implement Phase 1 (Unified SaveState architecture)
2. Create Phase 2 (Refactored useSaveStory hook)
3. Build Phase 3 (Backend API synchronization)
4. Complete Phase 4 (Component integration)
5. Execute Phase 5 (Error handling & recovery)
6. Finish Phase 6 (Migration & testing)

This plan establishes a robust foundation for reliable saved stories management that will support long-term user engagement and provide seamless cross-component synchronization.
