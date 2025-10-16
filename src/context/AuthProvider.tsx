import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
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
      setUser(null);
      window.location.href = '/app';
    } catch (err) {
      console.error("❌ Logout failed:", err);
      // Still clear local state even if API call fails
      setUser(null);
      window.location.href = '/app';
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
