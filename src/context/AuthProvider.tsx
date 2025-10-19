import React, { createContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSessions, type UserSessionItem } from '../hooks/useUserSessions';
import { useSavedStories, type SavedStoryItem } from '../hooks/useSavedStories';

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
  savedStories: string[];
  updateSaveStatus: (slug: string, saved: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Additional user-scoped data
  const { sessions, fetchSessions, clearSessions } = useUserSessions();
  const { savedStories: savedStoriesFromHook, fetchSavedStories, clearSaved } = useSavedStories();
  const fetchedExtrasForUserIdRef = useRef<string | null>(null);

  // Save story management
  const [savedStories, setSavedStories] = useState<string[]>([]);

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
      console.log("👋 Logging out...");
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      // Reset derived data holders
      fetchedExtrasForUserIdRef.current = null;
      setUser(null);
      setSavedStories([]);
      window.location.href = '/app';
    } catch (err) {
      console.error("❌ Logout failed:", err);
      // Still clear local state even if API call fails
      fetchedExtrasForUserIdRef.current = null;
      setUser(null);
      setSavedStories([]);
      window.location.href = '/app';
    }
  }, []);

  const updateSaveStatus = useCallback((slug: string, saved: boolean) => {
    console.log('[AuthProvider] savedStories updated:', { slug, saved });
    setSavedStories(prev => {
      const newList = saved 
        ? [...prev, slug] 
        : prev.filter(s => s !== slug);
      console.log('[AuthProvider] savedStories updated:', newList);
      return newList;
    });
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Fetch user-bound lists (sessions, saved stories) once user is known
  useEffect(() => {
    const userId = user?._id || null;
    if (!userId) return;
    if (fetchedExtrasForUserIdRef.current === userId) return; // avoid duplicate fetches
    fetchedExtrasForUserIdRef.current = userId;
    // Clear any previous user's lists to avoid leakage in UI
    clearSessions();
    clearSaved();
    setUser(prev => (prev ? { ...prev, sessions: [], savedStories: [] } : prev));
    console.log('[VERIFY_ISOLATION_FRONTEND] State cleared for user switch');
    console.log('[DATA_FETCH] Fetching sessions & savedStories for', user?.email);
    fetchSessions(user?.email);
    fetchSavedStories(user?.email);
    
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
  }, [user?._id, fetchSessions, fetchSavedStories, navigate]);

  // Merge fetched lists into user object to expose via context
  useEffect(() => {
    if (!user?._id) return;
    setUser(prev => (prev ? { ...prev, sessions, savedStories: savedStoriesFromHook } : prev));
  }, [sessions, savedStoriesFromHook]);

  // Cleanup on unmount or remount to ensure lists are cleared before next mount
  useEffect(() => {
    return () => {
      clearSessions();
      clearSaved();
      setUser(prev => (prev ? { ...prev, sessions: [], savedStories: [] } : prev));
      console.log('[VERIFY_ISOLATION_FRONTEND] State cleared in cleanup');
    };
  }, [clearSessions, clearSaved]);

  // Clear lists on connection reset (visibility change) to avoid stale leakage
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') return;
      setUser(prev => (prev ? { ...prev, sessions: [], savedStories: [] } : prev));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

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
        const storySlugs = data.saved?.map((story: any) => story.slug) || [];
        console.log('[AuthProvider] savedStories updated:', storySlugs);
        setSavedStories(storySlugs);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser: fetchUser,
        savedStories,
        updateSaveStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
