import React, { useEffect } from 'react';

export const LandingCenterPanel: React.FC = () => {
  const handleGoogleLogin = () => {
    const redirectUrl = `${window.location.origin}/play`;
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!isMounted) return;
        if (res.ok) {
          window.location.href = '/play';
        }
      } catch (err) {
        // ignore
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold mb-2">Welcome to Plaible</h1>
      <p className="text-gray-600 mb-6">Sign in to begin your story adventure.</p>
      <button
        onClick={handleGoogleLogin}
        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-base font-medium hover:bg-gray-50"
      >
        Continue with Google
      </button>
    </div>
  );
};


