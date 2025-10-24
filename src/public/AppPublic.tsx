import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingGridLayout } from '../layouts/LandingGridLayout';
import LandingFeed from '../components/LandingFeed';
import { AppGridLayout } from '../layouts/AppGridLayout';
import { PlayPage } from './PlayPage';
import { StoriesFeedPage } from '../pages/StoriesFeedPage';
import { StoryDetailsPage } from '../pages/StoryDetailsPage';
import { PackagesPage } from '../pages/PackagesPage';
import TransactionHistoryPage from '../pages/TransactionHistoryPage';
import PlayOnboardPage from '../pages/PlayOnboardPage';
import StoryRunnerPage from '../pages/StoryRunnerPage';
const StyleGuide = React.lazy(() => import('../pages/StyleGuide'));
import { StyleGuideLayout } from '../layouts/StyleGuideLayout';
import { UI_BG_TOKENS } from '../pages/tokens';
import { AuthProvider } from '../context/AuthProvider';

export const AppPublic: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/play" element={
          <AppGridLayout>
            <PlayPage />
          </AppGridLayout>
        } />
        <Route path="/app" element={<AppGridLayout />}>
          <Route index element={<StoriesFeedPage />} />
          <Route path="stories/:slug" element={<StoryDetailsPage />} />
          <Route path="packages" element={<PackagesPage />} />
          <Route path="transactions" element={<TransactionHistoryPage />} />
          <Route path="play/onboard/:storySlug/:characterSlug" element={<PlayOnboardPage />} />
          <Route path="play/run/:storySlug/:characterSlug" element={<StoryRunnerPage />} />
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
    </AuthProvider>
  );
};


