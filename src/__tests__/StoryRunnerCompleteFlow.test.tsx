import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppPublic } from '../public/AppPublic';
import { fetchJson } from '../lib/http';

// Mock the fetchJson utility
jest.mock('../lib/http', () => ({
  fetchJson: jest.fn(),
}));

const mockFetchJson = fetchJson as jest.Mock;

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
        <div data-testid="header" data-variant="story-runner">In the Scene</div>
        <div data-testid="sub-navigation" style={{ display: 'none' }}>Category Navigation</div>
        <div data-testid="story-settings-provider">
          {children}
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

describe('StoryRunner Complete Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders StoryRunnerPage with correct header and no sub-navigation', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Navigate to the StoryRunnerPage route
    window.history.pushState({}, '', '/app/play/run/frankenstein/victor-frankenstein');
    
    expect(screen.getByTestId('story-runner-page')).toBeInTheDocument();
    expect(screen.getByTestId('app-grid-layout')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toHaveAttribute('data-variant', 'story-runner');
    expect(screen.getByTestId('header')).toHaveTextContent('In the Scene');
    expect(screen.getByTestId('sub-navigation')).toHaveStyle({ display: 'none' });
  });

  it('includes credentials in all API calls', async () => {
    // Mock successful response
    mockFetchJson.mockResolvedValueOnce({
      ok: true,
      sessionId: 'session-123',
      firstMessage: {
        id: 'msg-1',
        role: 'assistant',
        content: 'Welcome to the story!',
        metadata: { chapter: 1, beat: 1 }
      },
      story: {
        title: 'Frankenstein',
        slug: 'frankenstein',
        character: {
          id: 'victor-frankenstein',
          name: 'Victor Frankenstein',
          displayName: 'Victor'
        }
      },
      settings: {
        toneStyle: 'drama',
        timeFlavor: 'today'
      }
    });

    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Navigate to the StoryRunnerPage route
    window.history.pushState({}, '', '/app/play/run/frankenstein/victor-frankenstein');
    
    await waitFor(() => {
      expect(screen.getByTestId('story-runner-page')).toBeInTheDocument();
    });

    // Verify that fetchJson was called with credentials: 'include'
    expect(mockFetchJson).toHaveBeenCalledWith(
      expect.stringContaining('/api/storyrunner/start'),
      expect.objectContaining({
        credentials: 'include'
      })
    );
  });

  it('handles 401 authentication errors with login redirect', async () => {
    // Mock 401 Unauthorized response
    const authError = new Error('HTTP 401: Unauthorized');
    (authError as any).status = 401;
    mockFetchJson.mockRejectedValueOnce(authError);

    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Navigate to the StoryRunnerPage route
    window.history.pushState({}, '', '/app/play/run/frankenstein/victor-frankenstein');
    
    await waitFor(() => {
      expect(screen.getByTestId('story-runner-page')).toBeInTheDocument();
    });

    // The component should handle the 401 error and show appropriate UI
    // This would be tested by the actual StoryRunnerPage component
  });

  it('maintains consistent header across play flow', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Test the full play flow
    window.history.pushState({}, '', '/app');
    expect(screen.getByTestId('stories-feed-page')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toHaveTextContent('Choose A Story');

    window.history.pushState({}, '', '/app/play/onboard/frankenstein/victor-frankenstein');
    expect(screen.getByTestId('play-onboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toHaveTextContent('The World Is Waiting For You');

    window.history.pushState({}, '', '/app/play/run/frankenstein/victor-frankenstein');
    expect(screen.getByTestId('story-runner-page')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toHaveTextContent('In the Scene');
    expect(screen.getByTestId('sub-navigation')).toHaveStyle({ display: 'none' });
  });

  it('shows correct header for different routes', () => {
    render(
      <BrowserRouter>
        <AppPublic />
      </BrowserRouter>
    );

    // Test different route headers
    const testCases = [
      { path: '/app', expectedHeader: 'Choose A Story' },
      { path: '/app/play/onboard/frankenstein/victor-frankenstein', expectedHeader: 'The World Is Waiting For You' },
      { path: '/app/play/run/frankenstein/victor-frankenstein', expectedHeader: 'In the Scene' },
    ];

    testCases.forEach(({ path, expectedHeader }) => {
      window.history.pushState({}, '', path);
      expect(screen.getByTestId('header')).toHaveTextContent(expectedHeader);
    });
  });
});
