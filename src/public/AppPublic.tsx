import React from 'react';
import { LandingGridLayout } from '../layouts/LandingGridLayout';
import { AppGridLayout } from '../layouts/AppGridLayout';
import { PlayPage } from './PlayPage';
const StyleGuide = React.lazy(() => import('../pages/StyleGuide.jsx'));

export const AppPublic: React.FC = () => {
  const isPlay = typeof window !== 'undefined' && window.location.pathname.startsWith('/play');
  const isStyleGuide = typeof window !== 'undefined' && window.location.pathname === '/styleguide';

  if (isPlay) {
    return (
      <AppGridLayout>
        <PlayPage />
      </AppGridLayout>
    );
  }

  if (isStyleGuide) {
    return (
      <LandingGridLayout
        center={
          <React.Suspense fallback={<div className="p-8 text-text-primary">Loading Style Guide…</div>}>
            <div className="w-full">
              <StyleGuide />
            </div>
          </React.Suspense>
        }
      />
    );
  }

  return <LandingGridLayout />;
};


