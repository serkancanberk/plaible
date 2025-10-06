import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingGridLayout } from '../layouts/LandingGridLayout';
import LandingFeed from '../components/LandingFeed';
import { AppGridLayout } from '../layouts/AppGridLayout';
import { PlayPage } from './PlayPage';
import { StoriesFeedPage } from '../pages/StoriesFeedPage';
import { StoryDetailsPage } from '../pages/StoryDetailsPage';
const StyleGuide = React.lazy(() => import('../pages/StyleGuide'));
import { StyleGuideLayout } from '../layouts/StyleGuideLayout';
import { UI_BG_TOKENS } from '../pages/tokens';

export const AppPublic: React.FC = () => {
  return (
    <Routes>
      <Route path="/play" element={
        <AppGridLayout>
          <PlayPage />
        </AppGridLayout>
      } />
      <Route path="/app" element={<AppGridLayout />}>
        <Route index element={<StoriesFeedPage />} />
        <Route path="stories/:slug" element={<StoryDetailsPage />} />
      </Route>
      <Route path="/styleguide" element={
        <React.Suspense fallback={<div className="p-8 text-text-primary">Loading Style Guide…</div>}>
          <StyleGuideLayout bgClass={UI_BG_TOKENS.muted}>
            <StyleGuide />
          </StyleGuideLayout>
        </React.Suspense>
      } />
      <Route path="*" element={<LandingGridLayout right={<LandingFeed />} />} />
    </Routes>
  );
};


