import React from 'react';
import { LandingGridLayout } from '../layouts/LandingGridLayout';
import { AppGridLayout } from '../layouts/AppGridLayout';
import { PlayPage } from './PlayPage';

export const AppPublic: React.FC = () => {
  const isPlay = typeof window !== 'undefined' && window.location.pathname.startsWith('/play');

  if (isPlay) {
    return (
      <AppGridLayout>
        <PlayPage />
      </AppGridLayout>
    );
  }

  return <LandingGridLayout />;
};


