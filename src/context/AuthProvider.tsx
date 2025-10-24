import React, { createContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSessions, type UserSessionItem } from '../hooks/useUserSessions';
import type { SavedStoryItem } from '../hooks/useSavedStories';
import { useToast } from '../components/ui/Toast';

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
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (redirectPath?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSessions?: () => Promise<void>;
  // Phase 2: Unified saved stories API - single source of truth
  savedStories: SavedStoryItem[];
  isSaved: (slug: string) => boolean;
  toggleSaved: (slug: string) => Promise<void>;
  syncSavedStories: () => Promise<void>;
  // Legacy support - will be removed
  updateSaveStatus: (slug: string, saved: boolean) => void;
  // Credits helper
  addCredits: (amount: number) => Promise<void>;
  // Toast helper (optional expose for consumers)
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  // Additional user-scoped data
  const { sessions, fetchSessions, clearSessions } = useUserSessions();
  const fetchedExtrasForUserIdRef = useRef<string | null>(null);

  // Phase 8: Immediate synchronous hydration
  const savedStoriesKey = `savedStories_${user?._id || 'guest'}`;
  const initialSavedStories = (() => {
    try {
      const stored = localStorage.getItem(savedStoriesKey);
      const parsed = stored ? JSON.parse(stored) : [];
      if (parsed.length > 0) {
        console.log('[SAVED_STATE][INIT_HYDRATE] loaded', parsed.length, 'stories from localStorage');
      }
      return parsed;
    } catch (err) {
      console.warn('[SAVED_STATE][INIT_HYDRATE] failed to parse localStorage', err);
      return [];
    }
  })();
  
  // Phase 3: Persistent state lock mechanism
  const [savedStories, setSavedStories] = useState<SavedStoryItem[]>(initialSavedStories);
  const [isHydrated, setIsHydrated] = useState(false);
  const [prevUserId, setPrevUserId] = useState<string | null>(null);
  
  // Phase 4: Sync suppression state
  const [isToggling, setIsToggling] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Phase 5: Persistent merge timestamps
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(0);
  const [lastHydratedAt, setLastHydratedAt] = useState<number>(0);
  
  // Phase 6: Hydration barrier state
  const [isHydrationReady, setIsHydrationReady] = useState(false);
  
  // Phase 7: Post-hydration reconciliation marker
  const [lastReconciledAt, setLastReconciledAt] = useState<number>(0);
  
  // Phase 9: State freeze flag
  const [isFrozen, setIsFrozen] = useState(true);
  
  // Phase 9: Atomic merge helper
  const atomicMergeSavedStories = useCallback((serverStories: SavedStoryItem[]) => {
    setSavedStories(prev => {
      const merged = [
        ...prev,
        ...serverStories.filter(s => !prev.some(p => p.slug === s.slug))
      ];
      console.log('[SAVED_STATE][ATOMIC_MERGE]', { before: prev.length, after: merged.length });
      return merged;
    });
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        credentials: "include",
        cache: 'no-store' as RequestCache
      });
      const data = await response.json();
      if (data.ok) {
        console.log("[AUTH_REFRESH] Token refreshed successfully");
        return true;
      } else {
        console.warn("[AUTH_REFRESH] Failed:", data.error);
        return false;
      }
    } catch (err) {
      console.error("[AUTH_REFRESH_ERROR]", err);
      return false;
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' as RequestCache });
      if (res.status === 401) {
        console.log("[AUTH] Missing cookie, attempting silent refresh");
        const refreshSuccess = await refreshAuth();
        if (refreshSuccess) {
          // Retry fetchUser after successful refresh
          const retryRes = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' as RequestCache });
          if (retryRes.ok) {
            const data = await retryRes.json();
            console.log('[AUTH_ME] Received user data after refresh:', {
              email: data.email,
              profilePictureUrl: data.profilePictureUrl,
              hasProfilePicture: !!data.profilePictureUrl,
              identity: data.identity
            });
            setUser(data);
            return;
          }
        }
        setUser(null);
        return;
      }
      
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
      
      console.log('[AUTH_ME] Received user data:', {
        email: data.email,
        profilePictureUrl: data.profilePictureUrl,
        hasProfilePicture: !!data.profilePictureUrl,
        identity: data.identity
      });
      
      // DATA_FLOW_DEBUG: Log user data structure and savedStories
      console.log('[DATA_FLOW_DEBUG][PROVIDER] User data loaded:', {
        hasUser: !!data,
        userId: data._id,
        hasSavedStories: !!data.savedStories,
        savedStoriesLength: data.savedStories?.length || 0,
        savedStoriesStructure: data.savedStories,
        timestamp: new Date().toISOString()
      });
      
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshAuth]);

  const login = useCallback((redirectPath = window.location.pathname) => {
    const origin = window.location.origin;
    const finalRedirect = `${origin}/api/auth/google?redirect=${encodeURIComponent(redirectPath)}`;
    
    // Debug logging to track origin and redirect paths
    console.log("[AUTH_TRIGGER]", {
      origin: window.location.origin,
      redirectPath,
      finalRedirect
    });
    
    // Optional safeguard to prevent admin environment login
    if (window.location.origin.includes("5174")) {
      console.warn("⚠️ Admin environment detected. Public login flow disabled here.");
      return;
    }
    
    window.location.href = finalRedirect;
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('[SAVED_STATE][LOGOUT]', {
        action: 'logout_start',
        userId: user?._id,
        savedCount: savedStories.length,
        timestamp: new Date().toISOString()
      });
      
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      
      // Phase 5: Clear only on explicit logout
      fetchedExtrasForUserIdRef.current = null;
      setUser(null);
      setSavedStories([]);
      setIsHydrated(false);
      setPrevUserId(null);
      setLastSyncedAt(0);
      setLastHydratedAt(0);
      
      // Clear localStorage for this user
      if (user?._id) {
        localStorage.removeItem(`savedStories_${user._id}`);
        localStorage.removeItem(`savedStories_lastReconciledAt_${user._id}`);
        console.log('[SAVED_STATE][LOGOUT_CLEAR]');
      }
      
      console.log('[SAVED_STATE][LOGOUT]', {
        action: 'logout_complete',
        timestamp: new Date().toISOString()
      });
      
      window.location.href = '/app';
    } catch (err) {
      console.error('[SAVED_STATE][LOGOUT] Logout failed:', err);
      // Still clear local state even if API call fails
      fetchedExtrasForUserIdRef.current = null;
      setUser(null);
      setSavedStories([]);
      setIsHydrated(false);
      setPrevUserId(null);
      setLastSyncedAt(0);
      setLastHydratedAt(0);
      window.location.href = '/app';
    }
  }, [user?._id, savedStories.length]);

  // Frontend-only credits addition helper (Phase 1)
  const addCredits = useCallback(async (amount: number) => {
    if (!user?._id) {
      console.warn('[CREDITS_UI] No user logged in.');
      return;
    }

    const prevBalance = user.wallet.balance;
    const optimistic = prevBalance + amount;

    // optimistic update
    setUser(prev => prev ? { ...prev, wallet: { ...prev.wallet, balance: optimistic } } : prev);

    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Top-up failed');

      const newBalance = (typeof data?.balance === 'number') ? data.balance : optimistic;
      setUser(prev => prev ? { ...prev, wallet: { ...prev.wallet, balance: newBalance } } : prev);

      console.log(`[CREDITS_UI] ✅ Added +${amount} credits (new balance: ${newBalance})`);
      console.log('[CREDITS_UI][HEADER_SYNC] Context updated — new wallet balance:', newBalance);
      showToast?.(`Added +${amount} credits!`, 'success');
    } catch (err: any) {
      console.error('[CREDITS_UI][ERROR]', err);
      // rollback
      setUser(prev => prev ? { ...prev, wallet: { ...prev.wallet, balance: prevBalance } } : prev);
      showToast?.('Failed to add credits. Please try again.', 'error');
    }
  }, [user, showToast]);

  const updateSaveStatus = useCallback((slug: string, saved: boolean) => {
    console.log('[AuthProvider] savedStories updated:', { slug, saved });
    setSavedStories(prev => {
      const exists = prev.some(s => s.slug === slug);
      const newList = saved
        ? (exists ? prev : [...prev, { slug, title: '', createdAt: new Date().toISOString() }])
        : prev.filter(s => s.slug !== slug);
      console.log('[AuthProvider] savedStories updated (objects):', newList);
      return newList;
    });
  }, []);

  // Phase 2: Unified saved stories API - single source of truth
  const isSaved = useCallback((slug: string) => {
    return savedStories.some(story => story.slug === slug);
  }, [savedStories]);

  const toggleSaved = useCallback(async (slug: string) => {
    if (!user?._id) return;
    
    const currentlySaved = isSaved(slug);
    const newSavedState = !currentlySaved;
    
    // Phase 4: Set toggle suppression flag
    setIsToggling(true);
    console.log('[SAVED_STATE][TRACE] toggle_start');
    
    // Store previous state for rollback
    const previousSavedStories = savedStories;
    
    // Optimistic update - single state source
    console.log('[SAVED_STATE][TRACE]', {
      action: 'toggle_optimistic_update',
      slug,
      result: newSavedState,
      timestamp: new Date().toISOString()
    });
    
    console.log('[SAVED_STATE][UNIFIED]', { 
      action: 'toggle_optimistic', 
      slug, 
      optimistic: true, 
      result: newSavedState,
      timestamp: new Date().toISOString()
    });
    
    console.log('[DEBUG][SAVED_SYNC][before_set]', {
      length: savedStories.length,
      first: savedStories[0]?.title || savedStories[0]?.slug || null,
      data: JSON.stringify(savedStories)
    });
    setSavedStories(prev => {
      const newStories = newSavedState 
        ? [...prev, { slug, title: '', createdAt: new Date().toISOString() }]
        : prev.filter(s => s.slug !== slug);
      
      console.log('[SAVED_STATE][TRACE]', {
        action: 'setSavedStories_called',
        slug,
        prevCount: prev.length,
        newCount: newStories.length,
        timestamp: new Date().toISOString()
      });
      console.log('[FORCE_RENDER][savedStories_updated]', newStories.length);
      console.log('[DEBUG][SAVED_SYNC][in_set]', {
        prevLength: prev.length,
        nextLength: newStories.length,
        nextFirst: newStories[0]?.title || newStories[0]?.slug || null,
        nextData: JSON.stringify(newStories)
      });
      // Force shallow clone to guarantee change detection
      return [...newStories];
    });
    setTimeout(() => {
      console.log('[DEBUG][SAVED_SYNC][after_set]', {
        length: savedStories.length,
        first: savedStories[0]?.title || savedStories[0]?.slug || null,
        data: JSON.stringify(savedStories)
      });
    }, 0);
    
    // Update user object to match unified state
    setUser(prev => {
      if (!prev) return prev;
      const newStories = newSavedState 
        ? [...(prev.savedStories || []), { slug, title: '', createdAt: new Date().toISOString() }]
        : (prev.savedStories || []).filter(s => s.slug !== slug);
      
      console.log('[SAVED_STATE][TRACE]', {
        action: 'setUser_called',
        slug,
        prevUserCount: prev.savedStories?.length || 0,
        newUserCount: newStories.length,
        timestamp: new Date().toISOString()
      });
      
      console.log('[FORCE_RENDER][user_savedStories_updated]', newStories.length);
      return { ...prev, savedStories: [...newStories] };
    });
    
    try {
      console.log('[SAVED_STATE][TRACE]', {
        action: 'api_request_start',
        slug,
        method: currentlySaved ? 'DELETE' : 'POST',
        endpoint: currentlySaved ? `/api/saves/${slug}` : '/api/saves',
        timestamp: new Date().toISOString()
      });
      
      if (currentlySaved) {
        // Unsave
        const res = await fetch(`/api/saves/${slug}`, { 
          method: "DELETE", 
          credentials: "include" 
        });
        
        if (!res.ok) {
          throw new Error(`Failed to unsave story: ${res.status}`);
        }
      } else {
        // Save
        const res = await fetch(`/api/saves`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storySlug: slug })
        });
        
        if (!res.ok) {
          throw new Error(`Failed to save story: ${res.status}`);
        }
      }
      
      console.log('[SAVED_STATE][TRACE] api_request_success');
      
      console.log('[SAVED_STATE][UNIFIED]', { 
        action: 'toggle_success', 
        slug, 
        optimistic: false, 
        result: newSavedState,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn('[SAVED_STATE][ERROR] Toggle failed, rolling back:', err);
      
      // Rollback optimistic update to previous state
      setSavedStories(previousSavedStories);
      setUser(prev => {
        if (!prev) return prev;
        return { ...prev, savedStories: previousSavedStories };
      });
      
      console.log('[SAVED_STATE][UNIFIED]', { 
        action: 'toggle_rollback', 
        slug, 
        error: err?.message,
        timestamp: new Date().toISOString()
      });
      
      throw err;
    } finally {
      // Phase 4: Ensure cooldown
      setTimeout(() => setIsToggling(false), 500);
    }
  }, [user?._id, isSaved, savedStories]);

  // Phase 2: Unified syncSavedStories with merge logic
  const syncSavedStories = useCallback(async () => {
    if (!user?._id) return;
    
    // Phase 4: Guard sync during toggle
    if (isToggling) {
      console.log('[SAVED_STATE][SYNC_SUPPRESSION] sync_skipped (toggle_in_progress)');
      return;
    }
    
    try {
      console.log('[SAVED_STATE][UNIFIED]', { 
        action: 'sync_start', 
        userId: user._id,
        source: 'server_sync',
        timestamp: new Date().toISOString()
      });
      
      const res = await fetch('/api/saves', { 
        credentials: 'include',
        cache: 'no-store' as RequestCache
      });
      
      if (!res.ok) {
        console.warn('[SAVED_STATE][UNIFIED] Sync failed:', res.status);
        return;
      }
      
      const data = await res.json();
      const serverStories = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.saved) ? data.saved : []);
      console.log('[SYNC] Reloaded saved stories:', serverStories.length, serverStories[0]);
      console.log('[DEBUG][SAVED_SYNC][sync_before_merge]', {
        localLength: savedStories.length,
        serverLength: serverStories.length
      });
      
      // DATA_FLOW_DEBUG: Log API response structure
      console.log('[DATA_FLOW_DEBUG][CONTEXT_INJECTION] API response received:', {
        rawResponse: data,
        serverStories: serverStories,
        serverStoriesLength: serverStories.length,
        serverStoriesStructure: serverStories.map((s: any) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          createdAt: s.createdAt,
          hasTitle: !!s.title,
          hasSlug: !!s.slug,
          hasId: !!s.id
        })),
        timestamp: new Date().toISOString()
      });
      
      // Phase 8: Skip empty server overwrite
      if (serverStories.length === 0 && savedStories.length > 0) {
        console.log('[SAVED_STATE][SNAPSHOT] skip_empty_server_overwrite');
        return;
      }
      
      // Phase 7: Reconciliation timing check
      const now = Date.now();
      const shouldReconcile = serverStories.length > 0 &&
        now - lastHydratedAt > 1000 &&
        now - lastReconciledAt > 500;
      
      if (!shouldReconcile) {
        console.log('[SAVED_STATE][RECONCILE] skip_redundant_sync', {
          serverCount: serverStories.length,
          timeSinceHydration: now - lastHydratedAt,
          timeSinceReconciliation: now - lastReconciledAt
        });
        return;
      }
      
      // Phase 9: Compute merged and update both states with fresh references
      const mergedNow = [
        ...savedStories,
        ...serverStories.filter((s: any) => !savedStories.some(l => l.slug === s.slug))
      ];
      setSavedStories(() => {
        console.log('[FORCE_RENDER][savedStories_updated]', mergedNow.length);
        return [...mergedNow];
      });
      
      // DATA_FLOW_DEBUG: Log before setUser call
        console.log('[DATA_FLOW_DEBUG][CONTEXT_INJECTION] Before setUser call:', {
        currentSavedStories: savedStories,
        serverStories: serverStories,
          mergedStories: [...savedStories, ...serverStories.filter((s: any) => !savedStories.some(l => l.slug === s.slug))],
        currentUser: user,
        timestamp: new Date().toISOString()
      });
      
      // Update user object to match merged state with fresh reference
      setUser(prev => {
        const updatedUser = prev ? { 
          ...prev, 
          savedStories: [...mergedNow]
        } : prev;
        if (updatedUser) {
          console.log('[FORCE_RENDER][user_savedStories_updated]', updatedUser.savedStories?.length || 0);
        }
        
        // DATA_FLOW_DEBUG: Log after setUser call
        console.log('[DATA_FLOW_DEBUG][CONTEXT_INJECTION] After setUser call:', {
          hasUser: !!updatedUser,
          userId: updatedUser?._id,
          hasSavedStories: !!updatedUser?.savedStories,
          savedStoriesLength: updatedUser?.savedStories?.length || 0,
          savedStoriesData: updatedUser?.savedStories,
          savedStoriesStructure: updatedUser?.savedStories?.map((s: any) => ({
            id: s.id,
            slug: s.slug,
            title: s.title,
            createdAt: s.createdAt,
            hasTitle: !!s.title,
            hasSlug: !!s.slug,
            hasId: !!s.id
          })),
          timestamp: new Date().toISOString()
        });
        
        return updatedUser;
      });
      
      setLastSyncedAt(Date.now());
      setLastReconciledAt(Date.now());
      
      // Phase 9: Release freeze after first successful merge
      if (isFrozen) {
        setIsFrozen(false);
        console.log('[SAVED_STATE][FREEZE] release');
      }
      
      // Phase 7: Persist reconciliation marker
      const mergedStories = mergedNow;
      localStorage.setItem(`savedStories_${user._id}`, JSON.stringify(mergedStories));
      localStorage.setItem(`savedStories_lastReconciledAt_${user._id}`, now.toString());
      
      console.log('[SAVED_STATE][RECONCILE] merged', { 
        server: serverStories.length, 
        local: savedStories.length,
        merged: mergedStories.length 
      });
      
      console.log('[SAVED_STATE][RECONCILE] timestamps', {
        lastHydratedAt,
        lastSyncedAt: now,
        lastReconciledAt: now
      });
      
      // Phase 8: Recovery mode - if both server and localStorage empty but user authenticated
      if (serverStories.length === 0 && savedStories.length === 0 && user?._id) {
        console.warn('[SAVED_STATE][RECOVERY] detected empty state, re-fetching /api/saves');
        // Note: This will trigger another sync cycle, but with proper guards
      }
      
    } catch (err: any) {
      console.warn('[SAVED_STATE][UNIFIED] Sync error:', err);
      console.log('[SAVED_STATE][UNIFIED]', { 
        action: 'sync_error', 
        userId: user._id,
        error: err?.message,
        timestamp: new Date().toISOString()
      });
    }
  }, [user?._id, isToggling, savedStories]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Phase 3: Protected user data fetching with persistent state lock
  useEffect(() => {
    const userId = user?._id || null;
    if (!userId) return;
    if (fetchedExtrasForUserIdRef.current === userId) return; // avoid duplicate fetches

    // Phase 6: Guard any early fetches before hydration ready or right after hydration
    if (!isHydrationReady) {
      console.log('[HYDRATION_GUARD] Not ready, skipping immediate sessions fetch');
      return;
    }

    const sinceHydrationMs = Date.now() - lastHydratedAt;
    const minDelayMs = 5000;
    const remaining = sinceHydrationMs < minDelayMs ? (minDelayMs - sinceHydrationMs) : 0;

    // Clear sessions but protect savedStories with persistent lock
    clearSessions();

    if (prevUserId && prevUserId !== userId) {
      console.log('[SAVED_STATE][PERSISTENT_LOCK]', {
        action: 'user_change_clear',
        prevUserId,
        newUserId: userId,
        timestamp: new Date().toISOString()
      });
      setSavedStories([]);
      setUser(prev => (prev ? { ...prev, sessions: [], savedStories: [] } : prev));
    } else {
      console.log('[SAVED_STATE][PERSISTENT_LOCK]', {
        action: 'user_switch_protected',
        userId,
        isHydrated,
        savedCount: savedStories.length,
        timestamp: new Date().toISOString()
      });
      setUser(prev => (prev ? { ...prev, sessions: [] } : prev));
    }

    setPrevUserId(userId);

    const scheduleOrFetch = () => {
      console.log('[AUTH_FLOW] Calling fetchSessions() for userId', userId);
      fetchedExtrasForUserIdRef.current = userId; // set when we actually start the fetch
      fetchSessions(user?.email)
        .then(() => {
          console.log('[AUTH_FLOW] fetchSessions completed, injecting into user.sessions');
          console.log('[RECENT_REFRESHED]', user?.email);
        })
        .catch(() => {})
        .finally(() => {});
    };

    if (remaining > 0) {
      console.log('[HYDRATION_GUARD] scheduling sessions fetch in', remaining, 'ms');
      const t = setTimeout(scheduleOrFetch, remaining);
      return () => clearTimeout(t);
    } else {
      scheduleOrFetch();
    }

    // Handle post-login redirect
    const returnTo = localStorage.getItem("returnTo");
    const pendingStory = localStorage.getItem("pendingStory");
    
    if (returnTo) {
      console.log('[LOGIN_REDIRECT] Redirecting to saved path:', returnTo);
      navigate(returnTo);
      localStorage.removeItem("returnTo");
      
      if (pendingStory) {
        try {
          const { storySlug, characterSlug } = JSON.parse(pendingStory);
          console.log('[LOGIN_REDIRECT] Restored story context:', { storySlug, characterSlug });
          localStorage.removeItem("pendingStory");
        } catch (error) {
          console.error('[LOGIN_REDIRECT] Failed to parse pending story:', error);
          localStorage.removeItem("pendingStory");
        }
      }
    }
  }, [user?._id, fetchSessions, navigate, prevUserId, isHydrated, savedStories.length, isHydrationReady, lastHydratedAt]);

  // Phase 2: Unified state - sessions are merged, savedStories is already unified
  useEffect(() => {
    if (!user?._id) return;
    setUser(prev => (prev ? { ...prev, sessions } : prev));
    try {
      console.log('[RECENT_REFRESHED] user.sessions length=', sessions?.length || 0);
    } catch {}
  }, [sessions, user?._id]);

  // Phase 2: Unified cleanup - single state source
  useEffect(() => {
    return () => {
      clearSessions();
      setSavedStories([]); // Clear unified saved stories state
      setUser(prev => (prev ? { ...prev, sessions: [], savedStories: [] } : prev));
      console.log('[SAVED_STATE][UNIFIED]', { 
        action: 'cleanup_clear', 
        timestamp: new Date().toISOString()
      });
    };
  }, [clearSessions]);

  // Phase 3: Protected visibility change - sync only, never clear
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && user && isHydrated) {
        console.log('[SAVED_STATE][RACE]', {
          action: 'visibility_trigger',
          userId: user._id,
          savedCount: savedStories.length,
          isHydrated,
          timestamp: new Date().toISOString()
        });
        
        console.log('[SAVED_STATE][VISIBILITY_SYNC]', {
          action: 'tab_visible_sync',
          userId: user._id,
          savedCount: savedStories.length,
          isHydrated,
          timestamp: new Date().toISOString()
        });
        syncSavedStories(); // Sync only, never clear
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [user, syncSavedStories, isHydrated]);

  // Fetch saved stories when user logs in
  useEffect(() => {
    const fetchSavedStoriesList = async () => {
      if (!user?._id) {
        setSavedStories([]);
        return;
      }

      try {
        console.log('[AuthProvider] Fetching saved stories for user:', user._id);
        const res = await fetch('/api/saves', {
          credentials: 'include',
          cache: 'no-store' as RequestCache
        });
        
        if (!res.ok) {
          console.warn('[AuthProvider] Failed to fetch saved stories:', res.status);
          return;
        }
        
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.saved) ? data.saved : []);
        console.log('[SYNC] Reloaded saved stories:', items.length, items[0]);
        console.log('[AuthProvider] savedStories updated (objects):', items);
        setSavedStories(items);
        setUser(prev => (prev ? { ...prev, savedStories: items } : prev));
      } catch (err) {
        console.error('[AuthProvider] Failed to fetch saved stories:', err);
      }
    };

    fetchSavedStoriesList();
  }, [user?._id]);

  // Auto-refresh interval to keep sessions alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (!user) {
        console.log("[AUTH_AUTO_REFRESH] No user, attempting refresh");
        refreshAuth().then(success => {
          if (success) {
            fetchUser();
          }
        });
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, refreshAuth, fetchUser]);

  // Phase 6: localStorage hydration with barrier
  useEffect(() => {
    const stored = localStorage.getItem(`savedStories_${user?._id}`);
    if (stored && user && !isHydrated) {
      try {
        const parsed = JSON.parse(stored);
        console.log('[SAVED_STATE][HYDRATE_LOCK]', { 
          action: 'hydrate_priority', 
          userId: user._id,
          count: parsed.length,
          source: 'localStorage',
          timestamp: new Date().toISOString()
        });
        
        // Update unified state from localStorage with lock
        setSavedStories(parsed);
        setUser(prev => prev ? { ...prev, savedStories: parsed } : prev);
        setIsHydrated(true);
        setLastHydratedAt(Date.now());
        setIsHydrationReady(true);
        
        // Phase 7: Load reconciliation marker from localStorage
        const reconciledKey = `savedStories_lastReconciledAt_${user._id}`;
        const storedReconciled = localStorage.getItem(reconciledKey);
        if (storedReconciled) {
          setLastReconciledAt(parseInt(storedReconciled, 10));
        }
        
        console.log('[SAVED_STATE][HYDRATION_BARRIER] localStorage hydrated');
        console.log('[SAVED_STATE][FREEZE] start_hydration');
        console.log('[SAVED_STATE][MERGE] hydrated_from_local', parsed.length);
        
        console.log('[SAVED_STATE][HYDRATE_LOCK]', { 
          action: 'hydration_complete', 
          userId: user._id,
          count: parsed.length,
          isHydrated: true,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[SAVED_STATE][HYDRATE_LOCK] Failed to parse stored saved stories:', err);
        setIsHydrated(true); // Mark as hydrated even on error to prevent retry
        setIsHydrationReady(true);
        console.log('[SAVED_STATE][HYDRATION_BARRIER] no local data, ready');
      }
    } else if (user && !stored) {
      // No stored data, mark as hydrated to allow server sync
      setIsHydrated(true);
      setIsHydrationReady(true);
      console.log('[SAVED_STATE][HYDRATION_BARRIER] no local data, ready');
      console.log('[SAVED_STATE][HYDRATE_LOCK]', { 
        action: 'no_localStorage_data', 
        userId: user._id,
        isHydrated: true,
        timestamp: new Date().toISOString()
      });
    }
  }, [user?._id, isHydrated]);

  // Phase 6: Hydration-first server sync with barrier
  useEffect(() => {
    if (!isHydrationReady || !user) return;
    
    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current as unknown as number);
    }
    
    // Phase 6: 800ms debounced sync on initial mount
    syncTimeoutRef.current = setTimeout(() => {
      if (!isToggling) {
        console.log('[SAVED_STATE][HYDRATION_BARRIER] proceeding to sync');
        syncSavedStories();
      }
    }, 800); // slightly longer debounce on initial mount
    
    return () => clearTimeout(syncTimeoutRef.current as unknown as number);
  }, [isHydrationReady, user?._id]);

  // Phase 8: Persistent snapshot on every state update
  useEffect(() => {
    if (user?._id && savedStories.length >= 0) {
      localStorage.setItem(`savedStories_${user._id}`, JSON.stringify(savedStories));
      console.log('[SAVED_STATE][SNAPSHOT] persisted', { count: savedStories.length });
      
      // DATA_FLOW_DEBUG: Log savedStories state updates
      console.log('[DATA_FLOW_DEBUG][PROVIDER] savedStories state updated:', {
        savedStoriesLength: savedStories.length,
        savedStoriesData: savedStories,
        userId: user._id,
        timestamp: new Date().toISOString()
      });
    }
  }, [savedStories, user?._id]);

  // DATA_FLOW_DEBUG: Log context provider value
  const contextValue = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser: fetchUser,
    refreshSessions: async () => { try { await fetchSessions(user?.email); } catch { /* noop */ } },
    // Phase 2: Unified saved stories API - single source of truth
    savedStories,
    isSaved,
    toggleSaved,
    syncSavedStories,
    // Phase 6: Hydration barrier for debugging
    hydrationReady: isHydrationReady,
    // Legacy support - will be removed
    updateSaveStatus,
    // Credits helper
    addCredits,
    // Toast helper expose
    showToast,
  }), [user, savedStories, isLoading, fetchUser, login, logout, isSaved, toggleSaved, syncSavedStories, isHydrationReady, updateSaveStatus, addCredits, showToast]);

  // Dev-only manual trigger for diagnosing fetch visibility
  try {
    (window as any).debugFetchSessions = fetchSessions;
  } catch {}
  
  console.log('[DATA_FLOW_DEBUG][CONTEXT_INJECTION] Context provider value:', {
    hasUser: !!contextValue.user,
    userId: contextValue.user?._id,
    hasSavedStories: !!contextValue.user?.savedStories,
    savedStoriesLength: contextValue.user?.savedStories?.length || 0,
    savedStoriesData: contextValue.user?.savedStories,
    savedStoriesStructure: contextValue.user?.savedStories?.map((s: any) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      createdAt: s.createdAt,
      hasTitle: !!s.title,
      hasSlug: !!s.slug,
      hasId: !!s.id
    })),
    timestamp: new Date().toISOString()
  });

  return (
    <>
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
      {ToastComponent}
    </>
  );
};
