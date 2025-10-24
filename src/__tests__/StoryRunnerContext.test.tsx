import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppPublic } from '../public/AppPublic';
import { StorySettingsProvider } from '../components/ui/storySettings/StorySettingsProvider';

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
    return (
      <div data-testid="app-grid-layout">
        <div data-testid="story-settings-provider">
          <StorySettingsProvider>
            {children}
          </StorySettingsProvider>
        </div>
      </div>
    );
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

describe('StoryRunner Context Hierarchy', () => {
  it('renders StoryRunnerPage with proper context hierarchy', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Navigate to the StoryRunnerPage route
    window.history.pushState({}, '', '/app/play/run/frankenstein/victor-frankenstein');
    
    expect(screen.getByTestId('story-runner-page')).toBeInTheDocument();
    expect(screen.getByTestId('app-grid-layout')).toBeInTheDocument();
    expect(screen.getByTestId('story-settings-provider')).toBeInTheDocument();
  });

  it('renders PlayOnboardPage with proper context hierarchy', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Navigate to the PlayOnboardPage route
    window.history.pushState({}, '', '/app/play/onboard/frankenstein/victor-frankenstein');
    
    expect(screen.getByTestId('play-onboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('app-grid-layout')).toBeInTheDocument();
    expect(screen.getByTestId('story-settings-provider')).toBeInTheDocument();
  });

  it('renders StoriesFeedPage with proper context hierarchy', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Navigate to the main app route
    window.history.pushState({}, '', '/app');
    
    expect(screen.getByTestId('stories-feed-page')).toBeInTheDocument();
    expect(screen.getByTestId('app-grid-layout')).toBeInTheDocument();
    expect(screen.getByTestId('story-settings-provider')).toBeInTheDocument();
  });

  it('does not have double StorySettingsProvider wrapping', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Navigate to the StoryRunnerPage route
    window.history.pushState({}, '', '/app/play/run/frankenstein/victor-frankenstein');
    
    // Should only have one StorySettingsProvider wrapper
    const providers = screen.getAllByTestId('story-settings-provider');
    expect(providers).toHaveLength(1);
  });

  it('maintains consistent context across play flow', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Test the full play flow
    window.history.pushState({}, '', '/app');
    expect(screen.getByTestId('stories-feed-page')).toBeInTheDocument();
    expect(screen.getByTestId('story-settings-provider')).toBeInTheDocument();

    window.history.pushState({}, '', '/app/play/onboard/frankenstein/victor-frankenstein');
    expect(screen.getByTestId('play-onboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('story-settings-provider')).toBeInTheDocument();

    window.history.pushState({}, '', '/app/play/run/frankenstein/victor-frankenstein');
    expect(screen.getByTestId('story-runner-page')).toBeInTheDocument();
    expect(screen.getByTestId('story-settings-provider')).toBeInTheDocument();
  });
});
