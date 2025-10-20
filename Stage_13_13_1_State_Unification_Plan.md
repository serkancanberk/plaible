# Stage 13.13.1 — State Unification Plan

## Executive Summary

This plan outlines the complete unification of authenticated user data under a single AuthProvider context, eliminating data fragmentation, race conditions, and inconsistent state management across the Plaible application.

---

## Phase 1: Current State Overview

### 1.1 Data Sources Audit

| **Data Type** | **Current Storage** | **Fetch Method** | **Components Using** | **Issues** |
|---------------|-------------------|------------------|---------------------|------------|
| **User Profile** | MongoDB User model | `/api/auth/me` | AuthProvider, Header, Sidebar | ✅ Centralized |
| **Profile Picture** | MongoDB User.profilePictureUrl | `/api/auth/me` | AuthProvider, Header | ✅ Consistent |
| **Wallet Balance** | MongoDB User.wallet.balance | `/api/auth/me` | AuthProvider, Admin Dashboard | ⚠️ Duplicated in WalletTransaction |
| **Saved Stories** | MongoDB Save collection | `/api/saves` | AuthProvider, StoryCard, Sidebar | ⚠️ Multiple fetch points |
| **User Sessions** | MongoDB Session collection | `/api/sessions` | AuthProvider, Sidebar | ⚠️ Separate from user object |
| **Story Settings** | MongoDB User.storySettings | `/api/story-settings/user` | StorySettingsProvider, StorySettingsModal | ⚠️ Global vs User-specific confusion |
| **Wallet Transactions** | MongoDB WalletTransaction collection | `/api/wallet/transactions` | Admin Dashboard | ⚠️ Not in user context |

### 1.2 Component Dependencies Map

**AuthProvider Dependencies:**
```typescript
// Current fragmented approach
const { sessions, fetchSessions, clearSessions } = useUserSessions();
const { savedStories, fetchSavedStories, clearSaved } = useSavedStories();
const [savedStories, setSavedStories] = useState<string[]>([]);
```

**Components Using User Data:**
- **Header/Sidebar**: `useAuth()` → `user.identity`, `user.profilePictureUrl`
- **StoryCard**: `useSaveStory()` → Individual story save status
- **StorySettingsModal**: `StorySettingsProvider` → User preferences
- **Admin Dashboard**: `adminApi` → Wallet balance, user status
- **StoryRunnerPage**: `AuthGuard` → Authentication check

### 1.3 Current Problems

1. **Data Fragmentation**: User data scattered across multiple hooks and state
2. **Race Conditions**: Multiple components fetching user data simultaneously
3. **Stale Data**: No automatic refresh mechanisms
4. **Inconsistent State**: Different loading states across components
5. **Memory Leaks**: User data not properly cleared on logout
6. **Duplicate API Calls**: Same data fetched multiple times

---

## Phase 2: Unified Data Model

### 2.1 Consolidated User Interface

```typescript
interface UnifiedUserData {
  // Core Profile (from /api/auth/me)
  _id: string;
  email: string;
  profilePictureUrl?: string;
  identity: {
    firstName: string;
    lastName: string;
    displayName: string;
  };
  
  // Wallet Information
  wallet: {
    balance: number;
    currency: string;
    recentTransactions: WalletTransaction[];
  };
  
  // User Content
  savedStories: SavedStoryItem[];
  sessions: UserSessionItem[];
  
  // User Preferences
  preferences: {
    storySettings: {
      preferredToneStyle: string | null;
      preferredTimeFlavor: string | null;
      lastUpdated: string;
    };
    uiPreferences: {
      theme: string;
      language: string;
    };
  };
  
  // Metadata
  lastActive: string;
  isOnline: boolean;
}
```

### 2.2 Enhanced Context Interface

```typescript
interface UnifiedAuthContextType {
  // Core Auth State
  user: UnifiedUserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Auth Actions
  login: (redirectPath?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // User Data Actions
  updateWalletBalance: (newBalance: number) => void;
  addSavedStory: (story: SavedStoryItem) => void;
  removeSavedStory: (storySlug: string) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Optimistic Updates
  optimisticSaveStory: (storySlug: string, saved: boolean) => void;
  optimisticUpdateBalance: (amount: number, type: 'credit' | 'debit') => void;
  
  // Data Refresh
  refreshUserData: () => Promise<void>;
  refreshWalletData: () => Promise<void>;
  refreshSavedStories: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  
  // Loading States
  isWalletLoading: boolean;
  isSavedStoriesLoading: boolean;
  isSessionsLoading: boolean;
  isPreferencesLoading: boolean;
}
```

### 2.3 Data Aggregation Strategy

**Single API Endpoint Approach:**
```typescript
// New unified endpoint: /api/user/dashboard
interface UserDashboardResponse {
  profile: UserProfile;
  wallet: {
    balance: number;
    recentTransactions: WalletTransaction[];
  };
  savedStories: SavedStoryItem[];
  sessions: UserSessionItem[];
  preferences: UserPreferences;
  metadata: {
    lastActive: string;
    isOnline: boolean;
  };
}
```

---

## Phase 3: API Flow Design

### 3.1 Login Flow

```typescript
const loginFlow = async (redirectPath: string) => {
  // 1. Redirect to Google OAuth
  window.location.href = `/api/auth/google?redirect=${encodeURIComponent(redirectPath)}`;
  
  // 2. After OAuth callback, fetch unified user data
  const userData = await fetch('/api/user/dashboard', { credentials: 'include' });
  
  // 3. Update AuthProvider state
  setUser(userData);
  setIsLoading(false);
  
  // 4. Handle redirect
  navigate(redirectPath);
};
```

### 3.2 Data Refresh Flow

```typescript
const refreshUserData = async () => {
  try {
    setIsLoading(true);
    
    // Fetch all user data in single request
    const response = await fetch('/api/user/dashboard', {
      credentials: 'include',
      cache: 'no-store'
    });
    
    if (response.ok) {
      const userData = await response.json();
      setUser(userData);
    } else if (response.status === 401) {
      // Try token refresh
      const refreshSuccess = await refreshAuth();
      if (refreshSuccess) {
        // Retry with fresh token
        return refreshUserData();
      } else {
        setUser(null);
      }
    }
  } catch (error) {
    console.error('Failed to refresh user data:', error);
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};
```

### 3.3 Logout Flow

```typescript
const logoutFlow = async () => {
  try {
    // 1. Clear server-side session
    await fetch('/api/auth/logout', { 
      method: 'POST', 
      credentials: 'include' 
    });
    
    // 2. Clear all local state
    setUser(null);
    setSavedStories([]);
    setSessions([]);
    setPreferences(null);
    
    // 3. Clear localStorage
    localStorage.removeItem('storySettings');
    localStorage.removeItem('returnTo');
    localStorage.removeItem('pendingStory');
    
    // 4. Redirect to landing
    navigate('/app');
  } catch (error) {
    console.error('Logout failed:', error);
    // Still clear local state
    setUser(null);
    navigate('/app');
  }
};
```

---

## Phase 4: Context Integration Plan

### 4.1 AuthProvider Refactoring

```typescript
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Unified state
  const [user, setUser] = useState<UnifiedUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Granular loading states
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [isSavedStoriesLoading, setIsSavedStoriesLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(false);
  
  // Data refresh functions
  const refreshUserData = useCallback(async () => {
    // Implementation as per Phase 3.2
  }, []);
  
  const refreshWalletData = useCallback(async () => {
    setIsWalletLoading(true);
    try {
      const response = await fetch('/api/wallet/me', { credentials: 'include' });
      if (response.ok) {
        const walletData = await response.json();
        setUser(prev => prev ? { ...prev, wallet: walletData } : null);
      }
    } finally {
      setIsWalletLoading(false);
    }
  }, []);
  
  // Optimistic updates
  const optimisticSaveStory = useCallback((storySlug: string, saved: boolean) => {
    setUser(prev => {
      if (!prev) return null;
      
      const updatedSavedStories = saved
        ? [...prev.savedStories, { slug: storySlug, title: '', createdAt: new Date().toISOString() }]
        : prev.savedStories.filter(story => story.slug !== storySlug);
      
      return { ...prev, savedStories: updatedSavedStories };
    });
  }, []);
  
  // Auto-refresh mechanism
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        refreshUserData();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [user, refreshUserData]);
  
  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser: refreshUserData,
      updateWalletBalance,
      addSavedStory,
      removeSavedStory,
      updateUserPreferences,
      optimisticSaveStory,
      optimisticUpdateBalance,
      refreshUserData,
      refreshWalletData,
      refreshSavedStories,
      refreshSessions,
      isWalletLoading,
      isSavedStoriesLoading,
      isSessionsLoading,
      isPreferencesLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4.2 Hook Consolidation

**Replace Multiple Hooks with Single useAuth:**

```typescript
// Before: Multiple hooks
const { user } = useAuth();
const { sessions } = useUserSessions();
const { savedStories } = useSavedStories();
const { data: walletData } = useWallet();

// After: Single unified hook
const { 
  user, 
  refreshUserData, 
  optimisticSaveStory,
  isWalletLoading 
} = useAuth();
```

### 4.3 Component Updates

**StoryCard Component:**
```typescript
const StoryCard = ({ storySlug, ...props }) => {
  const { user, optimisticSaveStory, isSavedStoriesLoading } = useAuth();
  
  const isSaved = user?.savedStories?.some(story => story.slug === storySlug) || false;
  
  const handleSaveToggle = async () => {
    // Optimistic update
    optimisticSaveStory(storySlug, !isSaved);
    
    try {
      // API call
      const response = await fetch(`/api/saves/${storySlug}`, {
        method: isSaved ? 'DELETE' : 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        // Rollback on failure
        optimisticSaveStory(storySlug, isSaved);
      }
    } catch (error) {
      // Rollback on error
      optimisticSaveStory(storySlug, isSaved);
    }
  };
  
  return (
    <button onClick={handleSaveToggle} disabled={isSavedStoriesLoading}>
      {isSaved ? 'Saved' : 'Save'}
    </button>
  );
};
```

---

## Phase 5: Migration Steps & Compatibility Notes

### 5.1 Backend API Changes

**New Unified Endpoint:**
```javascript
// routes/user.js
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.userId;
    
    // Fetch all user data in parallel
    const [user, savedStories, sessions, walletTransactions] = await Promise.all([
      User.findById(userId).lean(),
      Save.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      Session.find({ userId }).sort({ updatedAt: -1 }).limit(10).lean(),
      WalletTransaction.find({ userId }).sort({ date: -1 }).limit(5).lean()
    ]);
    
    // Calculate wallet balance from transactions
    const balance = walletTransactions.reduce((total, tx) => {
      return total + (tx.type === 'credit' ? tx.amount : -tx.amount);
    }, 0);
    
    const dashboardData = {
      profile: {
        _id: user._id,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
        identity: user.identity
      },
      wallet: {
        balance,
        currency: user.wallet?.currency || 'CREDITS',
        recentTransactions: walletTransactions
      },
      savedStories: savedStories.map(story => ({
        slug: story.slug,
        title: story.title,
        coverUrl: story.coverUrl,
        createdAt: story.createdAt
      })),
      sessions: sessions.map(session => ({
        _id: session._id,
        story: { title: session.story?.title || 'Unknown', slug: session.storyId },
        progress: session.progress,
        updatedAt: session.updatedAt
      })),
      preferences: {
        storySettings: user.storySettings || {},
        uiPreferences: {
          theme: 'light',
          language: 'en'
        }
      },
      metadata: {
        lastActive: user.updatedAt,
        isOnline: true
      }
    };
    
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user dashboard' });
  }
});
```

### 5.2 Frontend Migration Steps

**Step 1: Create New AuthProvider**
```typescript
// src/context/UnifiedAuthProvider.tsx
export const UnifiedAuthProvider = ({ children }) => {
  // Implementation as per Phase 4.1
};
```

**Step 2: Update App Structure**
```typescript
// src/public/AppPublic.tsx
export const AppPublic = () => {
  return (
    <UnifiedAuthProvider>
      <Routes>
        {/* Existing routes */}
      </Routes>
    </UnifiedAuthProvider>
  );
};
```

**Step 3: Migrate Components Gradually**
```typescript
// Phase 1: Update StoryCard
// Phase 2: Update Header/Sidebar
// Phase 3: Update StorySettingsModal
// Phase 4: Remove old hooks
```

**Step 4: Remove Legacy Hooks**
```typescript
// Delete these files after migration:
// - src/hooks/useUserSessions.ts
// - src/hooks/useSavedStories.ts
// - src/hooks/useUser.ts
```

### 5.3 Compatibility Notes

**Backward Compatibility:**
- Keep existing API endpoints during transition
- Maintain old hook interfaces with deprecation warnings
- Gradual migration of components

**Breaking Changes:**
- `useUserSessions` and `useSavedStories` hooks will be removed
- `useUser` hook will be deprecated in favor of `useAuth`
- StorySettingsProvider will be integrated into AuthProvider

**Migration Timeline:**
- **Week 1**: Implement new AuthProvider and API endpoint
- **Week 2**: Migrate core components (Header, Sidebar, StoryCard)
- **Week 3**: Migrate advanced components (StorySettingsModal, Admin Dashboard)
- **Week 4**: Remove legacy hooks and clean up

### 5.4 Testing Strategy

**Unit Tests:**
```typescript
describe('UnifiedAuthProvider', () => {
  it('should fetch user dashboard data on login', async () => {
    // Test implementation
  });
  
  it('should handle optimistic updates correctly', async () => {
    // Test implementation
  });
  
  it('should refresh data automatically', async () => {
    // Test implementation
  });
});
```

**Integration Tests:**
```typescript
describe('User Data Flow', () => {
  it('should sync saved stories across components', async () => {
    // Test implementation
  });
  
  it('should update wallet balance in real-time', async () => {
    // Test implementation
  });
});
```

---

## 6. Caching and Update Strategies

### 6.1 Data Caching

**In-Memory Caching:**
```typescript
const useDataCache = () => {
  const cache = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  const getCachedData = (key: string) => {
    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  };
  
  const setCachedData = (key: string, data: any) => {
    cache.current.set(key, { data, timestamp: Date.now() });
  };
  
  return { getCachedData, setCachedData };
};
```

**Smart Refresh Strategy:**
```typescript
const useSmartRefresh = () => {
  const lastRefresh = useRef<number>(0);
  const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes
  
  const shouldRefresh = () => {
    return Date.now() - lastRefresh.current > REFRESH_INTERVAL;
  };
  
  const markRefreshed = () => {
    lastRefresh.current = Date.now();
  };
  
  return { shouldRefresh, markRefreshed };
};
```

### 6.2 Optimistic Updates

**Save Story Optimistic Update:**
```typescript
const optimisticSaveStory = useCallback((storySlug: string, saved: boolean) => {
  setUser(prev => {
    if (!prev) return null;
    
    const updatedStories = saved
      ? [...prev.savedStories, { slug: storySlug, title: '', createdAt: new Date().toISOString() }]
      : prev.savedStories.filter(story => story.slug !== storySlug);
    
    return { ...prev, savedStories: updatedStories };
  });
  
  // Queue API call
  apiQueue.add(() => updateSavedStory(storySlug, saved));
}, []);
```

**Wallet Balance Optimistic Update:**
```typescript
const optimisticUpdateBalance = useCallback((amount: number, type: 'credit' | 'debit') => {
  setUser(prev => {
    if (!prev) return null;
    
    const newBalance = type === 'credit' 
      ? prev.wallet.balance + amount 
      : prev.wallet.balance - amount;
    
    return {
      ...prev,
      wallet: {
        ...prev.wallet,
        balance: newBalance
      }
    };
  });
}, []);
```

### 6.3 Real-time Updates

**WebSocket Integration (Future):**
```typescript
const useRealtimeUpdates = () => {
  useEffect(() => {
    const ws = new WebSocket('/ws/user-updates');
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      switch (update.type) {
        case 'WALLET_UPDATE':
          updateWalletBalance(update.balance);
          break;
        case 'SAVED_STORY_UPDATE':
          updateSavedStories(update.stories);
          break;
        case 'SESSION_UPDATE':
          updateSessions(update.sessions);
          break;
      }
    };
    
    return () => ws.close();
  }, []);
};
```

---

## 7. Implementation Checklist

### 7.1 Backend Tasks
- [ ] Create `/api/user/dashboard` endpoint
- [ ] Implement data aggregation logic
- [ ] Add wallet balance calculation from transactions
- [ ] Update user preferences API
- [ ] Add caching headers for performance

### 7.2 Frontend Tasks
- [ ] Create UnifiedAuthProvider
- [ ] Implement optimistic updates
- [ ] Add smart refresh mechanism
- [ ] Create data caching layer
- [ ] Update all components to use unified context

### 7.3 Testing Tasks
- [ ] Write unit tests for AuthProvider
- [ ] Create integration tests for data flow
- [ ] Test optimistic updates
- [ ] Verify error handling and rollbacks
- [ ] Performance testing for large datasets

### 7.4 Migration Tasks
- [ ] Create migration guide for components
- [ ] Update documentation
- [ ] Remove legacy hooks
- [ ] Clean up unused code
- [ ] Monitor performance metrics

---

## 8. Success Metrics

### 8.1 Performance Improvements
- **API Calls Reduced**: From 4+ calls to 1 call for user data
- **Loading Time**: 50% reduction in initial load time
- **Memory Usage**: 30% reduction in component memory usage
- **Bundle Size**: 15% reduction by removing duplicate hooks

### 8.2 Developer Experience
- **Code Complexity**: Simplified component logic
- **Debugging**: Single source of truth for user data
- **Maintenance**: Easier to add new user-related features
- **Testing**: More predictable state management

### 8.3 User Experience
- **Consistency**: All components show same user data
- **Performance**: Faster page loads and interactions
- **Reliability**: Fewer race conditions and stale data issues
- **Real-time**: Immediate updates with optimistic UI

---

## Conclusion

This State Unification Plan provides a comprehensive roadmap for consolidating all authenticated user data under a single AuthProvider context. The implementation will eliminate data fragmentation, improve performance, and provide a better developer and user experience.

The phased approach ensures minimal disruption during migration while providing clear success metrics and rollback strategies if needed.

**Next Steps:**
1. Implement Phase 1 (Backend API changes)
2. Create Phase 2 (Unified AuthProvider)
3. Begin Phase 3 (Component migration)
4. Complete Phase 4 (Testing and cleanup)

This plan establishes a solid foundation for scalable user state management that will support future feature development and maintain high performance standards.
