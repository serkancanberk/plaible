# Stage 13.13.3 — Persistent User Settings Sync Plan

## Executive Summary

This plan implements Persistent User Settings Sync between StorySettingsProvider and AuthProvider to ensure story settings (tone, time flavor, reading speed) are always consistent across modals, pages, and sessions. The solution includes smart debouncing, error handling, and unified context management.

---

## Current State Analysis

### Current Settings Management Issues

1. **Fragmented State Management**:
   - StorySettingsProvider manages local state independently
   - AuthProvider doesn't include user preferences
   - Multiple localStorage keys for different settings
   - No synchronization between contexts

2. **Inconsistent Data Flow**:
   - Settings saved to localStorage immediately
   - Backend sync is optional and non-blocking
   - No retry mechanism for failed saves
   - Guest vs authenticated user handling differs

3. **Missing Integration**:
   - No connection between AuthProvider and StorySettingsProvider
   - Settings not included in unified user context
   - No automatic sync on login/logout

---

## Phase 1: Unified UserPreferences Interface

### 1.1 Enhanced UserPreferences Type

**New Type Definition - src/types/UserPreferences.ts:**
```typescript
export interface UserPreferences {
  // Core story settings
  preferredToneStyle: string;
  preferredTimeFlavor: string;
  
  // Extended preferences (future-proofing)
  readingSpeed?: 'slow' | 'medium' | 'fast';
  contentSensitivity?: 'low' | 'medium' | 'high';
  interactionStyle?: 'passive' | 'interactive' | 'immersive';
  
  // Metadata
  lastUpdated: string;
  version: number;
}

export interface UserPreferencesUpdate {
  preferredToneStyle?: string;
  preferredTimeFlavor?: string;
  readingSpeed?: 'slow' | 'medium' | 'fast';
  contentSensitivity?: 'low' | 'medium' | 'high';
  interactionStyle?: 'passive' | 'interactive' | 'immersive';
}

export interface UserPreferencesResponse {
  ok: boolean;
  preferences: UserPreferences | null;
  error?: string;
}

export interface UserPreferencesSyncState {
  isSyncing: boolean;
  lastSync: Date | null;
  pendingChanges: UserPreferencesUpdate | null;
  syncError: string | null;
  retryCount: number;
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
  savedStories?: SavedStoryItem[];
  // NEW: User preferences
  preferences?: UserPreferences;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (redirectPath?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  savedStories: string[];
  updateSaveStatus: (slug: string, saved: boolean) => void;
  // NEW: User preferences management
  updateUserPreferences: (preferences: UserPreferencesUpdate) => Promise<void>;
  syncUserPreferences: () => Promise<void>;
  preferencesSyncState: UserPreferencesSyncState;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferencesSyncState, setPreferencesSyncState] = useState<UserPreferencesSyncState>({
    isSyncing: false,
    lastSync: null,
    pendingChanges: null,
    syncError: null,
    retryCount: 0
  });

  // Debounced preferences update
  const debouncedUpdatePreferences = useMemo(
    () => debounce(async (preferences: UserPreferencesUpdate) => {
      await updateUserPreferences(preferences);
    }, 500),
    []
  );

  const updateUserPreferences = useCallback(async (preferences: UserPreferencesUpdate) => {
    setPreferencesSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }));
    
    try {
      // Update local state immediately (optimistic update)
      setUser(prev => prev ? {
        ...prev,
        preferences: {
          ...prev.preferences,
          ...preferences,
          lastUpdated: new Date().toISOString(),
          version: (prev.preferences?.version || 0) + 1
        }
      } : null);

      // Save to localStorage immediately
      const currentPreferences = user?.preferences;
      const updatedPreferences = { ...currentPreferences, ...preferences };
      localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));

      // Sync to backend
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error(`Failed to sync preferences: ${response.status}`);
      }

      const data = await response.json();
      
      // Update with server response
      setUser(prev => prev ? {
        ...prev,
        preferences: data.preferences
      } : null);

      setPreferencesSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        pendingChanges: null,
        syncError: null,
        retryCount: 0
      }));

      console.log('[AUTH] User preferences updated successfully');
    } catch (error) {
      console.error('[AUTH] Failed to update preferences:', error);
      
      setPreferencesSyncState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error.message,
        retryCount: prev.retryCount + 1
      }));

      // Retry logic
      if (preferencesSyncState.retryCount < 3) {
        setTimeout(() => {
          updateUserPreferences(preferences);
        }, 2000 * (preferencesSyncState.retryCount + 1));
      }
    }
  }, [user?.preferences, preferencesSyncState.retryCount]);

  const syncUserPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/user/preferences', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(prev => prev ? {
          ...prev,
          preferences: data.preferences
        } : null);
      }
    } catch (error) {
      console.error('[AUTH] Failed to sync preferences:', error);
    }
  }, [user]);

  // Load preferences on user login
  useEffect(() => {
    if (user && !user.preferences) {
      syncUserPreferences();
    }
  }, [user, syncUserPreferences]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser: fetchUser,
      savedStories,
      updateSaveStatus,
      updateUserPreferences: debouncedUpdatePreferences,
      syncUserPreferences,
      preferencesSyncState
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Phase 2: Enhanced StorySettingsProvider

### 2.1 Refactored StorySettingsProvider

**Updated StorySettingsProvider - src/components/ui/storySettings/StorySettingsProvider.tsx:**
```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { fetchJson } from '../../../lib/http';
import { UserPreferences, UserPreferencesUpdate } from '../../../types/UserPreferences';

export interface StorySetting {
  id: string;
  displayLabel: string;
  description?: string;
}

export interface StorySettings {
  tone_styles: StorySetting[];
  time_flavors: StorySetting[];
}

export interface StorySettingsContextType {
  selectedToneStyle: StorySetting | null;
  selectedTimeFlavor: StorySetting | null;
  availableToneStyles: StorySetting[];
  availableTimeFlavors: StorySetting[];
  savedPreferences: UserPreferences | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  setSelectedToneStyle: (style: StorySetting | null) => void;
  setSelectedTimeFlavor: (flavor: StorySetting | null) => void;
  savePreferences: () => Promise<void>;
  loadUserPreferences: () => Promise<void>;
  resetToDefaults: () => void;
  // NEW: Sync with AuthProvider
  syncWithAuth: () => void;
  isSynced: boolean;
}

const StorySettingsContext = createContext<StorySettingsContextType | undefined>(undefined);

export const useStorySettingsContext = () => {
  const context = useContext(StorySettingsContext);
  if (!context) {
    throw new Error('useStorySettingsContext must be used within a StorySettingsProvider');
  }
  return context;
};

interface StorySettingsProviderProps {
  children: ReactNode;
}

export const StorySettingsProvider: React.FC<StorySettingsProviderProps> = ({ children }) => {
  const { user, updateUserPreferences, preferencesSyncState } = useAuth();
  
  const [selectedToneStyle, setSelectedToneStyle] = useState<StorySetting | null>(null);
  const [selectedTimeFlavor, setSelectedTimeFlavor] = useState<StorySetting | null>(null);
  const [availableToneStyles, setAvailableToneStyles] = useState<StorySetting[]>([]);
  const [availableTimeFlavors, setAvailableTimeFlavors] = useState<StorySetting[]>([]);
  const [savedPreferences, setSavedPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  // Sync with AuthProvider when user changes
  useEffect(() => {
    if (user?.preferences) {
      setSavedPreferences(user.preferences);
      setIsSynced(true);
      
      // Update selected values from user preferences
      const toneStyle = availableToneStyles.find(
        style => style.id === user.preferences.preferredToneStyle
      );
      const timeFlavor = availableTimeFlavors.find(
        flavor => flavor.id === user.preferences.preferredTimeFlavor
      );
      
      if (toneStyle) setSelectedToneStyle(toneStyle);
      if (timeFlavor) setSelectedTimeFlavor(timeFlavor);
    } else {
      setIsSynced(false);
    }
  }, [user?.preferences, availableToneStyles, availableTimeFlavors]);

  // Load available settings on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load available settings
      const settingsResponse = await fetchJson<{ ok: boolean; settings: StorySettings }>('/api/story-settings/settings');
      if (settingsResponse.ok) {
        setAvailableToneStyles(settingsResponse.settings.tone_styles);
        setAvailableTimeFlavors(settingsResponse.settings.time_flavors);
      }

      // Load user preferences from AuthProvider
      if (user?.preferences) {
        setSavedPreferences(user.preferences);
        setIsSynced(true);
      } else {
        // Load from localStorage for guest users
        const localPreferences = loadFromLocalStorage();
        if (localPreferences) {
          setSavedPreferences(localPreferences);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load story settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLocalStorage = (): UserPreferences | null => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.preferredToneStyle && parsed.preferredTimeFlavor) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load preferences from localStorage:', err);
    }
    return null;
  };

  const saveToLocalStorage = (preferences: UserPreferences) => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (err) {
      console.warn('Failed to save preferences to localStorage:', err);
    }
  };

  const getDefaultPreferences = (): UserPreferences => {
    const originalToneStyle = availableToneStyles.find(style => 
      style.id.toLowerCase().includes('original') || 
      style.displayLabel.toLowerCase().includes('original')
    );
    const originalTimeFlavor = availableTimeFlavors.find(flavor => 
      flavor.id.toLowerCase().includes('original') || 
      flavor.displayLabel.toLowerCase().includes('original')
    );

    return {
      preferredToneStyle: originalToneStyle?.id || availableToneStyles[0]?.id || 'original',
      preferredTimeFlavor: originalTimeFlavor?.id || availableTimeFlavors[0]?.id || 'original',
      lastUpdated: new Date().toISOString(),
      version: 1
    };
  };

  const savePreferences = async () => {
    if (!selectedToneStyle || !selectedTimeFlavor) {
      setError('Please select both tone style and time flavor');
      return;
    }

    setIsSaving(true);
    setError(null);

    const preferences: UserPreferencesUpdate = {
      preferredToneStyle: selectedToneStyle.id,
      preferredTimeFlavor: selectedTimeFlavor.id
    };

    try {
      if (user) {
        // Authenticated user: sync through AuthProvider
        await updateUserPreferences(preferences);
        setSavedPreferences(user.preferences || null);
      } else {
        // Guest user: save to localStorage
        const fullPreferences: UserPreferences = {
          ...preferences,
          lastUpdated: new Date().toISOString(),
          version: 1
        };
        saveToLocalStorage(fullPreferences);
        setSavedPreferences(fullPreferences);
      }

      console.log('Preferences saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const syncWithAuth = useCallback(() => {
    if (user?.preferences) {
      setSavedPreferences(user.preferences);
      setIsSynced(true);
    }
  }, [user?.preferences]);

  const resetToDefaults = () => {
    const defaultPrefs = getDefaultPreferences();
    
    const defaultToneStyle = availableToneStyles.find(
      style => style.id === defaultPrefs.preferredToneStyle
    );
    const defaultTimeFlavor = availableTimeFlavors.find(
      flavor => flavor.id === defaultPrefs.preferredTimeFlavor
    );
    
    if (defaultToneStyle) setSelectedToneStyle(defaultToneStyle);
    if (defaultTimeFlavor) setSelectedTimeFlavor(defaultTimeFlavor);
    
    setSavedPreferences(defaultPrefs);
    saveToLocalStorage(defaultPrefs);
  };

  const contextValue: StorySettingsContextType = {
    selectedToneStyle,
    selectedTimeFlavor,
    availableToneStyles,
    availableTimeFlavors,
    savedPreferences,
    isLoading,
    isSaving,
    error,
    setSelectedToneStyle,
    setSelectedTimeFlavor,
    savePreferences,
    loadUserPreferences: loadInitialData,
    resetToDefaults,
    syncWithAuth,
    isSynced
  };

  return (
    <StorySettingsContext.Provider value={contextValue}>
      {children}
    </StorySettingsContext.Provider>
  );
};
```

---

## Phase 3: Backend API Integration

### 3.1 Enhanced User Preferences API

**New Route - routes/userPreferences.js:**
```javascript
import { Router } from 'express';
import { User } from '../models/User.js';
import { verifyJwt } from '../auth/config.js';

const router = Router();

/**
 * GET /api/user/preferences
 * Get user's preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    const token = req.cookies?.plaible_jwt;
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const decoded = verifyJwt(token);
    const userId = decoded?.sub || decoded?.uid;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Invalid token' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const preferences = user.storySettings ? {
      preferredToneStyle: user.storySettings.preferredToneStyle,
      preferredTimeFlavor: user.storySettings.preferredTimeFlavor,
      readingSpeed: user.storySettings.readingSpeed || 'medium',
      contentSensitivity: user.storySettings.contentSensitivity || 'medium',
      interactionStyle: user.storySettings.interactionStyle || 'interactive',
      lastUpdated: user.updatedAt.toISOString(),
      version: user.storySettings.version || 1
    } : null;

    res.json({
      ok: true,
      preferences
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

/**
 * PATCH /api/user/preferences
 * Update user's preferences
 */
router.patch('/preferences', async (req, res) => {
  try {
    const token = req.cookies?.plaible_jwt;
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const decoded = verifyJwt(token);
    const userId = decoded?.sub || decoded?.uid;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Invalid token' });
    }

    const { preferredToneStyle, preferredTimeFlavor, readingSpeed, contentSensitivity, interactionStyle } = req.body;

    const updateData = {};
    if (preferredToneStyle !== undefined) updateData['storySettings.preferredToneStyle'] = preferredToneStyle;
    if (preferredTimeFlavor !== undefined) updateData['storySettings.preferredTimeFlavor'] = preferredTimeFlavor;
    if (readingSpeed !== undefined) updateData['storySettings.readingSpeed'] = readingSpeed;
    if (contentSensitivity !== undefined) updateData['storySettings.contentSensitivity'] = contentSensitivity;
    if (interactionStyle !== undefined) updateData['storySettings.interactionStyle'] = interactionStyle;

    // Increment version
    updateData['storySettings.version'] = { $inc: 1 };

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, upsert: false }
    );

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const preferences = {
      preferredToneStyle: user.storySettings.preferredToneStyle,
      preferredTimeFlavor: user.storySettings.preferredTimeFlavor,
      readingSpeed: user.storySettings.readingSpeed || 'medium',
      contentSensitivity: user.storySettings.contentSensitivity || 'medium',
      interactionStyle: user.storySettings.interactionStyle || 'interactive',
      lastUpdated: user.updatedAt.toISOString(),
      version: user.storySettings.version || 1
    };

    res.json({
      ok: true,
      preferences
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

export default router;
```

### 3.2 Enhanced User Model

**Updated User Model - models/User.js:**
```javascript
// Add to existing User schema
const userSchema = new Schema({
  // ... existing fields ...
  
  storySettings: {
    preferredToneStyle: { type: String, default: 'original' },
    preferredTimeFlavor: { type: String, default: 'original' },
    readingSpeed: { type: String, enum: ['slow', 'medium', 'fast'], default: 'medium' },
    contentSensitivity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    interactionStyle: { type: String, enum: ['passive', 'interactive', 'immersive'], default: 'interactive' },
    version: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});
```

---

## Phase 4: Smart Debounce & Error Handling

### 4.1 Debounce Utility

**New Utility - src/utils/debounce.ts:**
```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  let result: ReturnType<T>;

  const debounced = ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) result = func(...args);
    };

    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) result = func(...args);
    
    return result;
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
```

### 4.2 Error Recovery System

**Error Recovery Hook - src/hooks/usePreferencesSync.ts:**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { UserPreferencesUpdate } from '../types/UserPreferences';

interface SyncState {
  isRetrying: boolean;
  retryCount: number;
  lastError: string | null;
  pendingChanges: UserPreferencesUpdate | null;
}

export const usePreferencesSync = () => {
  const { preferencesSyncState, updateUserPreferences } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    pendingChanges: null
  });

  const retrySync = useCallback(async () => {
    if (!syncState.pendingChanges || syncState.retryCount >= 3) return;

    setSyncState(prev => ({ ...prev, isRetrying: true }));
    
    try {
      await updateUserPreferences(syncState.pendingChanges);
      setSyncState({
        isRetrying: false,
        retryCount: 0,
        lastError: null,
        pendingChanges: null
      });
    } catch (error) {
      setSyncState(prev => ({
        ...prev,
        isRetrying: false,
        retryCount: prev.retryCount + 1,
        lastError: error.message
      }));
    }
  }, [syncState.pendingChanges, syncState.retryCount, updateUserPreferences]);

  const queueSync = useCallback((changes: UserPreferencesUpdate) => {
    setSyncState(prev => ({
      ...prev,
      pendingChanges: { ...prev.pendingChanges, ...changes }
    }));
  }, []);

  // Auto-retry on network recovery
  useEffect(() => {
    const handleOnline = () => {
      if (syncState.pendingChanges && !syncState.isRetrying) {
        retrySync();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncState.pendingChanges, syncState.isRetrying, retrySync]);

  return {
    syncState,
    retrySync,
    queueSync
  };
};
```

---

## Phase 5: Integration & Testing

### 5.1 App Integration

**Updated App Structure:**
```typescript
// src/public/AppPublic.tsx
export const AppPublic: React.FC = () => {
  return (
    <AuthProvider>
      <StorySettingsProvider>
        <Routes>
          {/* Existing routes */}
        </Routes>
      </StorySettingsProvider>
    </AuthProvider>
  );
};
```

### 5.2 Enhanced StorySettingsModal

**Updated StorySettingsModal - src/components/ui/modals/StorySettingsModal.tsx:**
```typescript
const StorySettingsModal: React.FC<StorySettingsModalProps> = ({ open, onClose, onSaveSettings }) => {
  const {
    selectedToneStyle,
    selectedTimeFlavor,
    availableToneStyles,
    availableTimeFlavors,
    savedPreferences,
    isLoading,
    isSaving,
    error,
    setSelectedToneStyle,
    setSelectedTimeFlavor,
    savePreferences,
    resetToDefaults,
    isSynced
  } = useStorySettingsContext();

  const { preferencesSyncState } = useAuth();

  // Auto-save on change with debounce
  useEffect(() => {
    if (selectedToneStyle && selectedTimeFlavor) {
      const timeout = setTimeout(() => {
        savePreferences();
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedToneStyle, selectedTimeFlavor, savePreferences]);

  // Show sync status
  const getSyncStatus = () => {
    if (preferencesSyncState.isSyncing) return 'Syncing...';
    if (preferencesSyncState.syncError) return 'Sync failed';
    if (isSynced) return 'Synced';
    return 'Local only';
  };

  return (
    <BaseModal open={open} onClose={onClose}>
      {/* Modal content */}
      
      {/* Sync status indicator */}
      <div className="text-xs text-text-tertiary mt-2">
        Status: {getSyncStatus()}
      </div>
    </BaseModal>
  );
};
```

### 5.3 Verification Checklist

**UI Consistency Tests:**
- [ ] Settings persist across page reloads
- [ ] Settings sync between modals and pages
- [ ] Guest users get localStorage fallback
- [ ] Authenticated users get server sync
- [ ] Settings update in real-time across components

**API Sync Tests:**
- [ ] Preferences save to backend immediately
- [ ] Failed saves retry automatically
- [ ] Network recovery triggers sync
- [ ] Version conflicts handled gracefully
- [ ] Debounce prevents spam requests

**Local Persistence Tests:**
- [ ] localStorage backup works
- [ ] Settings survive browser restart
- [ ] Guest mode works offline
- [ ] Data migration from old format
- [ ] Cleanup on logout

**Error Handling Tests:**
- [ ] Network failures show user feedback
- [ ] Retry logic works correctly
- [ ] Fallback to localStorage
- [ ] Graceful degradation
- [ ] Error recovery on reconnect

---

## Implementation Timeline

### Week 1: Core Infrastructure
- [ ] Create UserPreferences types
- [ ] Update AuthProvider with preferences
- [ ] Implement debounce utility
- [ ] Create backend API routes

### Week 2: Provider Integration
- [ ] Refactor StorySettingsProvider
- [ ] Implement sync mechanisms
- [ ] Add error handling
- [ ] Create retry logic

### Week 3: Testing & Polish
- [ ] Comprehensive testing
- [ ] UI consistency verification
- [ ] Performance optimization
- [ ] Error recovery testing

### Week 4: Deployment
- [ ] Staging deployment
- [ ] User acceptance testing
- [ ] Production deployment
- [ ] Monitoring setup

---

## Success Metrics

### Performance Improvements
- **Sync Speed**: < 500ms for preference updates
- **Error Recovery**: 95% success rate on retry
- **Debounce Efficiency**: 80% reduction in API calls
- **UI Responsiveness**: Immediate local updates

### User Experience
- **Consistency**: Settings sync across all components
- **Reliability**: 99% preference persistence
- **Offline Support**: Guest mode works without network
- **Error Handling**: Clear feedback on failures

### Technical Quality
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive retry logic
- **Performance**: Optimized debouncing
- **Maintainability**: Clean separation of concerns

---

## Conclusion

This Persistent User Settings Sync plan provides a comprehensive solution for ensuring story settings consistency across the Plaible app. The implementation includes smart debouncing, error handling, and unified context management while maintaining backward compatibility and providing excellent user experience.

The phased approach ensures minimal disruption during implementation while providing clear success metrics and comprehensive testing coverage.

**Next Steps:**
1. Implement Phase 1 (Unified UserPreferences interface)
2. Create Phase 2 (Enhanced StorySettingsProvider)
3. Build Phase 3 (Backend API integration)
4. Complete Phase 4 (Smart debounce & error handling)
5. Execute Phase 5 (Integration & testing)

This plan establishes a robust foundation for reliable settings management that will support long-term user engagement and provide seamless cross-component synchronization.
