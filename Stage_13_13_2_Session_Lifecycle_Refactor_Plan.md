# Stage 13.13.2 — Session Lifecycle Refactor Plan

## Executive Summary

This plan refactors the session lifecycle management to improve authentication persistence, implement proper token rotation, and ensure comprehensive cleanup on logout. The focus is on extending session duration, implementing automatic renewal, and creating robust error handling for expired tokens.

---

## Current State Analysis

### Current Token Management Issues

1. **Inconsistent Token Lifetimes**: 
   - Public: `plaible_jwt` (7d) + `refreshToken` (30d) 
   - Admin: `admin_token` (1h) + `admin_refresh_token` (30d)
   - No token rotation on refresh

2. **Refresh Token Storage**:
   - Public refresh tokens stored in cookies (not database)
   - Admin refresh tokens stored in database with proper validation
   - Inconsistent refresh mechanisms

3. **Session Cleanup**:
   - Partial cleanup on logout
   - No context state clearing
   - No automatic token expiration handling

---

## Phase 1: Token Duration & Refresh Mechanism

### 1.1 Extended Token Lifetimes

**New Token Configuration:**
```javascript
// Token lifetimes (extended from current)
const TOKEN_CONFIG = {
  ACCESS_TOKEN_DURATION: '7d',        // Extended from 1h (admin) / 7d (public)
  REFRESH_TOKEN_DURATION: '30d',      // Consistent across admin/public
  ROTATION_THRESHOLD: '6d',           // Rotate refresh token when 1 day remaining
  CLEANUP_INTERVAL: '1d'              // Clean expired tokens daily
};
```

### 1.2 Unified Refresh Token System

**Backend Changes - routes/auth.js:**
```javascript
// Enhanced refresh endpoint with token rotation
router.get("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token" });
    }

    // Verify refresh token (database lookup for public users too)
    const tokenDoc = await RefreshToken.findAndValidate(refreshToken);
    if (!tokenDoc) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate new access token
    const newAccessToken = signJwt({ 
      sub: user._id.toString(),
      email: user.email,
      name: user.identity?.displayName || user.fullName,
      role: Array.isArray(user.roles) && user.roles.includes('admin') ? 'admin' : 'user'
    }, { expiresIn: '7d' });

    // Token rotation: Generate new refresh token if close to expiration
    const shouldRotate = tokenDoc.expiresAt.getTime() - Date.now() < (24 * 60 * 60 * 1000); // 1 day
    let newRefreshToken = refreshToken;
    
    if (shouldRotate) {
      // Revoke old refresh token
      await RefreshToken.revokeToken(refreshToken);
      
      // Create new refresh token
      const newTokenDoc = await RefreshToken.createToken(
        user._id, 
        user.email, 
        req.get('User-Agent') || '', 
        req.ip || ''
      );
      newRefreshToken = newTokenDoc.token;
    }

    // Set new access token cookie
    res.cookie("plaible_jwt", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set new refresh token cookie (if rotated)
    if (shouldRotate) {
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }

    console.log('[AUTH_REFRESH] Token refreshed successfully for user:', user.email);
    return res.json({ 
      ok: true, 
      rotated: shouldRotate,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (err) {
    console.error("[AUTH_REFRESH_ERROR]", err.message);
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});
```

### 1.3 Enhanced OAuth Callback

**Updated OAuth Callback - routes/auth.js:**
```javascript
// Google OAuth callback with database refresh tokens
router.get("/google/callback", 
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/failure" }),
  async (req, res) => {
    try {
      const user = req.user;
      const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin');
      
      // Generate access token
      const accessToken = signJwt({ 
        sub: user._id.toString(),
        email: user.email,
        name: user.identity?.displayName || user.fullName,
        role: isAdmin ? 'admin' : 'user'
      }, { expiresIn: '7d' });

      // Create database refresh token
      const refreshTokenDoc = await RefreshToken.createToken(
        user._id,
        user.email,
        req.get('User-Agent') || '',
        req.ip || ''
      );

      if (isAdmin) {
        res.cookie('admin_token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (extended from 1h)
        });
        
        res.cookie('admin_refresh_token', refreshTokenDoc.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      } else {
        res.cookie('plaible_jwt', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
        res.cookie('refreshToken', refreshTokenDoc.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }

      // Redirect logic...
    } catch (error) {
      console.error('❌ [OAUTH CALLBACK ERROR]', error);
      return res.redirect('/api/auth/failure');
    }
  }
);
```

---

## Phase 2: Automatic Renewal Flow

### 2.1 useSessionLifecycle Hook

**New Hook - src/hooks/useSessionLifecycle.ts:**
```typescript
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

interface SessionLifecycleConfig {
  refreshThreshold: number; // milliseconds before expiry to refresh
  maxRetries: number;
  retryDelay: number;
}

interface SessionLifecycleState {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
  retryCount: number;
  error: string | null;
}

export const useSessionLifecycle = (config: SessionLifecycleConfig = {
  refreshThreshold: 24 * 60 * 60 * 1000, // 24 hours
  maxRetries: 3,
  retryDelay: 5000
}) => {
  const { user, refreshUser, logout } = useAuth();
  const [state, setState] = useState<SessionLifecycleState>({
    isRefreshing: false,
    lastRefresh: null,
    nextRefresh: null,
    retryCount: 0,
    error: null
  });
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const calculateNextRefresh = useCallback(() => {
    if (!user) return null;
    
    // Assume token expires in 7 days, refresh 24 hours before
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const refreshTime = new Date(tokenExpiry.getTime() - config.refreshThreshold);
    
    return refreshTime;
  }, [user, config.refreshThreshold]);

  const performRefresh = useCallback(async () => {
    if (state.isRefreshing) return;
    
    setState(prev => ({ ...prev, isRefreshing: true, error: null }));
    
    try {
      const response = await fetch('/api/auth/refresh', {
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[SESSION_LIFECYCLE] Token refreshed successfully');
        
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          lastRefresh: new Date(),
          nextRefresh: calculateNextRefresh(),
          retryCount: 0,
          error: null
        }));
        
        // Update user data if needed
        if (data.rotated) {
          await refreshUser();
        }
        
        // Schedule next refresh
        scheduleNextRefresh();
      } else {
        throw new Error(`Refresh failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[SESSION_LIFECYCLE] Refresh failed:', error);
      
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: error.message,
        retryCount: prev.retryCount + 1
      }));
      
      // Retry logic
      if (state.retryCount < config.maxRetries) {
        console.log(`[SESSION_LIFECYCLE] Retrying in ${config.retryDelay}ms (attempt ${state.retryCount + 1}/${config.maxRetries})`);
        retryTimeoutRef.current = setTimeout(performRefresh, config.retryDelay);
      } else {
        console.error('[SESSION_LIFECYCLE] Max retries exceeded, logging out');
        await logout();
      }
    }
  }, [state.isRefreshing, state.retryCount, config, refreshUser, logout, calculateNextRefresh]);

  const scheduleNextRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    const nextRefresh = calculateNextRefresh();
    if (!nextRefresh) return;
    
    const timeUntilRefresh = nextRefresh.getTime() - Date.now();
    
    if (timeUntilRefresh > 0) {
      refreshTimeoutRef.current = setTimeout(performRefresh, timeUntilRefresh);
      setState(prev => ({ ...prev, nextRefresh }));
      console.log(`[SESSION_LIFECYCLE] Next refresh scheduled for ${nextRefresh.toISOString()}`);
    }
  }, [calculateNextRefresh, performRefresh]);

  // Initialize on user login
  useEffect(() => {
    if (user) {
      scheduleNextRefresh();
    } else {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      setState({
        isRefreshing: false,
        lastRefresh: null,
        nextRefresh: null,
        retryCount: 0,
        error: null
      });
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [user, scheduleNextRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    refresh: performRefresh,
    scheduleNextRefresh
  };
};
```

### 2.2 Enhanced AuthProvider Integration

**Updated AuthProvider - src/context/AuthProvider.tsx:**
```typescript
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Session lifecycle management
  const sessionLifecycle = useSessionLifecycle({
    refreshThreshold: 24 * 60 * 60 * 1000, // 24 hours
    maxRetries: 3,
    retryDelay: 5000
  });

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        credentials: "include",
        cache: 'no-store' as RequestCache
      });
      
      if (response.ok) {
        console.log("[AUTH_REFRESH] Token refreshed successfully");
        return true;
      } else {
        console.warn("[AUTH_REFRESH] Failed:", response.status);
        return false;
      }
    } catch (err) {
      console.error("[AUTH_REFRESH_ERROR]", err);
      return false;
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { 
        credentials: 'include', 
        cache: 'no-store' as RequestCache 
      });
      
      if (res.status === 401) {
        console.log("[AUTH] Missing cookie, attempting silent refresh");
        const refreshSuccess = await refreshAuth();
        if (refreshSuccess) {
          const retryRes = await fetch('/api/auth/me', { 
            credentials: 'include', 
            cache: 'no-store' as RequestCache 
          });
          if (retryRes.ok) {
            const data = await retryRes.json();
            setUser(data);
            return;
          }
        }
        setUser(null);
        return;
      }
      
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
      setUser(data);
    } catch (error) {
      console.error('[AUTH] Fetch user failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshAuth]);

  // Enhanced logout with comprehensive cleanup
  const logout = useCallback(async () => {
    try {
      console.log("👋 Logging out...");
      
      // Clear session lifecycle
      sessionLifecycle.scheduleNextRefresh = () => {}; // Disable scheduling
      
      // Server-side logout
      await fetch('/api/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
      
      // Clear all local state
      setUser(null);
      
      // Clear localStorage
      localStorage.removeItem('storySettings');
      localStorage.removeItem('returnTo');
      localStorage.removeItem('pendingStory');
      
      // Clear any pending timeouts
      if (sessionLifecycle.refreshTimeoutRef?.current) {
        clearTimeout(sessionLifecycle.refreshTimeoutRef.current);
      }
      
      // Redirect to landing
      navigate('/app');
    } catch (err) {
      console.error("❌ Logout failed:", err);
      // Still clear local state
      setUser(null);
      navigate('/app');
    }
  }, [navigate, sessionLifecycle]);

  // Auto-refresh on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Check if token needs refresh when tab becomes visible
        sessionLifecycle.refresh();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, sessionLifecycle]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser: fetchUser,
      sessionLifecycle
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Phase 3: Logout Cleanup Sequence

### 3.1 Comprehensive Logout Flow

**Enhanced Logout Endpoint - routes/auth.js:**
```javascript
// Enhanced logout with complete cleanup
router.post("/logout", async (req, res) => {
  try {
    console.log('👋 User logout initiated');
    
    // Get user ID from token for cleanup
    let userId = null;
    const token = req.cookies?.plaible_jwt || req.cookies?.admin_token;
    if (token) {
      try {
        const decoded = verifyJwt(token);
        userId = decoded?.sub || decoded?.uid;
      } catch (err) {
        console.log('Token verification failed during logout:', err.message);
      }
    }
    
    // Revoke all refresh tokens for user
    if (userId) {
      try {
        await RefreshToken.revokeAllForUser(userId);
        console.log(`All refresh tokens revoked for user: ${userId}`);
      } catch (error) {
        console.error("Error revoking refresh tokens:", error);
      }
    }
    
    // Clear all auth cookies with proper options
    const cookieOpts = {
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      secure: isProduction || FORCE_SECURE_COOKIE,
      maxAge: 0, // Expire immediately
      path: "/",
    };
    
    res.clearCookie("plaible_jwt", cookieOpts);
    res.clearCookie("admin_token", cookieOpts);
    res.clearCookie("admin_refresh_token", cookieOpts);
    res.clearCookie("refreshToken", cookieOpts);
    res.clearCookie("connect.sid", { httpOnly: true, sameSite: 'lax', maxAge: 0 });
    
    // Clear session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        } else {
          console.log("Session cleared successfully");
        }
      });
    }
    
    console.log('✅ User logged out successfully');
    return res.status(200).json({ 
      ok: true,
      message: 'Logout successful',
      cleared: {
        cookies: ['plaible_jwt', 'admin_token', 'admin_refresh_token', 'refreshToken'],
        refreshTokens: userId ? 'all' : 'none',
        session: true
      }
    });
  } catch (err) {
    console.error('❌ Logout error:', err);
    return res.status(500).json({ 
      ok: false,
      message: 'Logout failed' 
    });
  }
});
```

### 3.2 Frontend Context Cleanup

**Context State Cleanup - src/context/AuthProvider.tsx:**
```typescript
const logout = useCallback(async () => {
  try {
    console.log("👋 Logging out...");
    
    // 1. Clear session lifecycle timers
    if (sessionLifecycle.refreshTimeoutRef?.current) {
      clearTimeout(sessionLifecycle.refreshTimeoutRef.current);
    }
    if (sessionLifecycle.retryTimeoutRef?.current) {
      clearTimeout(sessionLifecycle.retryTimeoutRef.current);
    }
    
    // 2. Server-side logout
    const response = await fetch('/api/auth/logout', { 
      method: 'POST', 
      credentials: 'include' 
    });
    
    if (!response.ok) {
      console.warn('Server logout failed, continuing with local cleanup');
    }
    
    // 3. Clear all local state
    setUser(null);
    setIsLoading(false);
    
    // 4. Clear localStorage
    const keysToRemove = [
      'storySettings',
      'returnTo', 
      'pendingStory',
      'userPreferences',
      'sessionData'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn(`Failed to remove ${key} from localStorage:`, err);
      }
    });
    
    // 5. Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch (err) {
      console.warn('Failed to clear sessionStorage:', err);
    }
    
    // 6. Reset all context states
    // Note: This would be expanded based on other context providers
    // For now, we'll emit a custom event that other contexts can listen to
    window.dispatchEvent(new CustomEvent('auth:logout', {
      detail: { timestamp: new Date().toISOString() }
    }));
    
    // 7. Redirect to landing
    navigate('/app');
    
    console.log('✅ Logout completed successfully');
  } catch (err) {
    console.error("❌ Logout failed:", err);
    // Still clear local state even if API call fails
    setUser(null);
    navigate('/app');
  }
}, [navigate, sessionLifecycle]);
```

### 3.3 Cross-Context Cleanup

**StorySettingsProvider Cleanup:**
```typescript
// src/components/ui/storySettings/StorySettingsProvider.tsx
useEffect(() => {
  const handleLogout = () => {
    // Clear all story settings state
    setSelectedToneStyle(null);
    setSelectedTimeFlavor(null);
    setSavedPreferences(null);
    setError(null);
    
    // Clear localStorage
    localStorage.removeItem('storySettings');
    
    console.log('[StorySettingsProvider] Cleared on logout');
  };
  
  window.addEventListener('auth:logout', handleLogout);
  return () => window.removeEventListener('auth:logout', handleLogout);
}, []);
```

---

## Phase 4: Hook Integration & Testing Checklist

### 4.1 Integration Points

**App.tsx Integration:**
```typescript
// src/public/AppPublic.tsx
export const AppPublic: React.FC = () => {
  return (
    <AuthProvider>
      <SessionLifecycleProvider>
        <Routes>
          {/* Existing routes */}
        </Routes>
      </SessionLifecycleProvider>
    </AuthProvider>
  );
};
```

**SessionLifecycleProvider:**
```typescript
// src/context/SessionLifecycleProvider.tsx
export const SessionLifecycleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Initialize session lifecycle for authenticated users
  useSessionLifecycle({
    refreshThreshold: 24 * 60 * 60 * 1000, // 24 hours
    maxRetries: 3,
    retryDelay: 5000
  });
  
  return <>{children}</>;
};
```

### 4.2 Error Handling & Recovery

**Token Expiration Handling:**
```typescript
// Enhanced error handling in AuthProvider
const handleTokenError = useCallback(async (error: any) => {
  console.error('[AUTH] Token error:', error);
  
  if (error.message?.includes('expired') || error.message?.includes('invalid')) {
    console.log('[AUTH] Token expired/invalid, attempting refresh');
    
    const refreshSuccess = await refreshAuth();
    if (!refreshSuccess) {
      console.log('[AUTH] Refresh failed, logging out');
      await logout();
    }
  }
}, [refreshAuth, logout]);
```

### 4.3 Testing Checklist

**Unit Tests:**
```typescript
describe('useSessionLifecycle', () => {
  it('should schedule refresh before token expiry', async () => {
    // Test implementation
  });
  
  it('should handle refresh failures with retry logic', async () => {
    // Test implementation
  });
  
  it('should logout after max retries exceeded', async () => {
    // Test implementation
  });
  
  it('should cleanup timers on unmount', () => {
    // Test implementation
  });
});
```

**Integration Tests:**
```typescript
describe('Session Lifecycle Integration', () => {
  it('should automatically refresh tokens before expiry', async () => {
    // Test implementation
  });
  
  it('should clear all state on logout', async () => {
    // Test implementation
  });
  
  it('should handle network failures gracefully', async () => {
    // Test implementation
  });
});
```

**Manual Testing Checklist:**
- [ ] Login creates proper refresh tokens in database
- [ ] Automatic refresh works 24 hours before expiry
- [ ] Token rotation works correctly
- [ ] Logout clears all cookies and database tokens
- [ ] Network failures trigger retry logic
- [ ] Max retries exceeded triggers logout
- [ ] Tab visibility change triggers refresh check
- [ ] Cleanup works on component unmount

### 4.4 Performance Monitoring

**Session Lifecycle Metrics:**
```typescript
// Add metrics collection
const trackSessionMetrics = (event: string, data: any) => {
  console.log(`[SESSION_METRICS] ${event}:`, {
    timestamp: new Date().toISOString(),
    userId: user?._id,
    ...data
  });
  
  // Send to analytics service
  if (window.gtag) {
    window.gtag('event', 'session_lifecycle', {
      event_category: 'auth',
      event_label: event,
      value: data.duration || 0
    });
  }
};
```

---

## Implementation Timeline

### Week 1: Backend Changes
- [ ] Update token lifetimes in auth routes
- [ ] Implement database refresh token storage for public users
- [ ] Add token rotation logic
- [ ] Enhance logout endpoint

### Week 2: Frontend Hook Development
- [ ] Create useSessionLifecycle hook
- [ ] Implement automatic refresh logic
- [ ] Add error handling and retry mechanisms
- [ ] Create SessionLifecycleProvider

### Week 3: Integration & Testing
- [ ] Integrate with AuthProvider
- [ ] Add cross-context cleanup
- [ ] Implement comprehensive testing
- [ ] Add performance monitoring

### Week 4: Deployment & Monitoring
- [ ] Deploy to staging environment
- [ ] Monitor session metrics
- [ ] Fine-tune refresh thresholds
- [ ] Production deployment

---

## Success Metrics

### Performance Improvements
- **Session Duration**: Extended from 1h/7d to 7d consistently
- **Token Rotation**: Automatic refresh token rotation
- **Cleanup Efficiency**: 100% state cleanup on logout
- **Error Recovery**: Graceful handling of network failures

### User Experience
- **Seamless Sessions**: No forced re-login for 7 days
- **Automatic Renewal**: Background token refresh
- **Error Handling**: Graceful degradation on failures
- **Clean Logout**: Complete state reset

### Security Enhancements
- **Token Rotation**: Regular refresh token rotation
- **Database Storage**: All refresh tokens stored securely
- **Proper Cleanup**: Complete session invalidation
- **Audit Trail**: Comprehensive logging

---

## Conclusion

This Session Lifecycle Refactor plan provides a comprehensive solution for improving authentication persistence and cleanup logic. The implementation extends session duration, implements automatic renewal, and ensures robust error handling while maintaining security best practices.

The phased approach ensures minimal disruption during implementation while providing clear success metrics and monitoring capabilities.

**Next Steps:**
1. Implement Phase 1 (Backend token changes)
2. Create Phase 2 (Frontend lifecycle hook)
3. Integrate Phase 3 (Logout cleanup)
4. Complete Phase 4 (Testing and monitoring)

This plan establishes a solid foundation for reliable session management that will support long-term user engagement while maintaining security standards.
