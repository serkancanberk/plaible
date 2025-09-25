import React from 'react';
import { LandingGridLayout } from '../layouts/LandingGridLayout';
import LandingFeed from '../components/LandingFeed';
import { AppGridLayout } from '../layouts/AppGridLayout';
import { PlayPage } from './PlayPage';
const StyleGuide = React.lazy(() => import('../pages/StyleGuide'));
import { StyleGuideLayout } from '../layouts/StyleGuideLayout';
import { UI_BG_TOKENS } from '../pages/tokens';

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
      <React.Suspense fallback={<div className="p-8 text-text-primary">Loading Style Guide…</div>}>
        <StyleGuideLayout bgClass={UI_BG_TOKENS.muted}>
          <StyleGuide />
        </StyleGuideLayout>
      </React.Suspense>
    );
  }

  return <LandingGridLayout right={<LandingFeed />} />;
};


