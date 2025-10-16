import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const LoginPrompt: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-text-primary">
      <h2 className="text-heading mb-spacing-sm">Sign in to start your story</h2>
      <p className="text-body text-text-tertiary mb-spacing-md">
        Continue your journey by signing in with Google.
      </p>
      <button
        onClick={() => login(window.location.pathname)}
        className="px-5 py-3 bg-yellow-400 text-black font-medium rounded hover:bg-yellow-300 transition"
      >
        <span className="mr-2">🔑</span> Sign in with Google
      </button>
    </div>
  );
};
