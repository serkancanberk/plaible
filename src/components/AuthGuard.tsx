import React, { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoginPrompt } from './LoginPrompt';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-text-tertiary">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPrompt />;
  }

  return <>{children}</>;
};
