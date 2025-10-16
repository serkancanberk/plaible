import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppPublic } from '../public/AppPublic';

// Mock the components to avoid complex dependencies
jest.mock('../pages/StoryRunnerPage', () => {
  return function MockStoryRunnerPage() {
    return <div data-testid="story-runner-page">StoryRunnerPage</div>;
  };
});

jest.mock('../pages/PlayOnboardPage', () => {
  return function MockPlayOnboardPage() {
    return <div data-testid="play-onboard-page">PlayOnboardPage</div>;
  };
});

jest.mock('../pages/StoriesFeedPage', () => {
  return function MockStoriesFeedPage() {
    return <div data-testid="stories-feed-page">StoriesFeedPage</div>;
  };
});

jest.mock('../pages/StoryDetailsPage', () => {
  return function MockStoryDetailsPage() {
    return <div data-testid="story-details-page">StoryDetailsPage</div>;
  };
});

jest.mock('../layouts/AppGridLayout', () => {
  return function MockAppGridLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="app-grid-layout">{children}</div>;
  };
});

jest.mock('../layouts/LandingGridLayout', () => {
  return function MockLandingGridLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="landing-grid-layout">{children}</div>;
  };
});

jest.mock('../components/LandingFeed', () => {
  return function MockLandingFeed() {
    return <div data-testid="landing-feed">LandingFeed</div>;
  };
});

jest.mock('../public/PlayPage', () => {
  return function MockPlayPage() {
    return <div data-testid="play-page">PlayPage</div>;
  };
});

describe('StoryRunner Route Mounting', () => {
  it('renders StoryRunnerPage for /app/play/run/:storySlug/:characterSlug route', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Navigate to the route
    window.history.pushState({}, '', '/app/play/run/frankenstein/the-creature');
    
    expect(screen.getByTestId('story-runner-page')).toBeInTheDocument();
    expect(screen.getByTestId('app-grid-layout')).toBeInTheDocument();
  });

  it('renders PlayOnboardPage for /app/play/onboard/:storySlug/:characterSlug route', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Navigate to the route
    window.history.pushState({}, '', '/app/play/onboard/frankenstein/the-creature');
    
    expect(screen.getByTestId('play-onboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('app-grid-layout')).toBeInTheDocument();
  });

  it('renders StoriesFeedPage for /app route', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Navigate to the route
    window.history.pushState({}, '', '/app');
    
    expect(screen.getByTestId('stories-feed-page')).toBeInTheDocument();
    expect(screen.getByTestId('app-grid-layout')).toBeInTheDocument();
  });

  it('does not double-wrap AppGridLayout', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Navigate to the route
    window.history.pushState({}, '', '/app/play/run/frankenstein/the-creature');
    
    // Should only have one AppGridLayout wrapper
    const appGridLayouts = screen.getAllByTestId('app-grid-layout');
    expect(appGridLayouts).toHaveLength(1);
  });
});
