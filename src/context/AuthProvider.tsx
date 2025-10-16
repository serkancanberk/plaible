import React, { createContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Additional user-scoped data
  const { sessions, fetchSessions, clearSessions } = useUserSessions();
  const { savedStories, fetchSavedStories, clearSaved } = useSavedStories();
  const fetchedExtrasForUserIdRef = useRef<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' as RequestCache });
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
  }, []);

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
      window.location.href = '/app';
    } catch (err) {
      console.error("❌ Logout failed:", err);
      // Still clear local state even if API call fails
      fetchedExtrasForUserIdRef.current = null;
      setUser(null);
      window.location.href = '/app';
    }
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
  }, [user?._id, fetchSessions, fetchSavedStories]);

  // Merge fetched lists into user object to expose via context
  useEffect(() => {
    if (!user?._id) return;
    setUser(prev => (prev ? { ...prev, sessions, savedStories } : prev));
  }, [sessions, savedStories]);

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
