import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStorySession } from '../hooks/useStorySession';
import { fetchJson } from '../lib/http';

// Mock the fetchJson utility
jest.mock('../lib/http', () => ({
  fetchJson: jest.fn(),
}));

const mockFetchJson = fetchJson as jest.Mock;

// Mock the StorySettingsProvider
jest.mock('../components/ui/storySettings/StorySettingsProvider', () => ({
  useStorySettingsContext: jest.fn(() => ({
    selectedToneStyle: { id: 'drama', displayLabel: 'Drama' },
    selectedTimeFlavor: { id: 'today', displayLabel: 'Today' },
    availableToneStyles: [],
    availableTimeFlavors: [],
    savedPreferences: null,
    isLoading: false,
    isSaving: false,
    error: null,
    setSelectedToneStyle: jest.fn(),
    setSelectedTimeFlavor: jest.fn(),
    savePreferences: jest.fn(),
    loadUserPreferences: jest.fn(),
    resetToDefaults: jest.fn(),
  })),
}));

// Mock component to test the hook
function TestComponent() {
  const { startSession, isLoading, error } = useStorySession();
  
  const handleStart = async () => {
    try {
      await startSession();
    } catch (err) {
      console.error('Start session failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleStart} disabled={isLoading}>
        {isLoading ? 'Starting...' : 'Start Session'}
      </button>
      {error && <div data-testid="error">{error}</div>}
    </div>
  );
}

describe('StoryRunner Payload & Context Binding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should build correct payload from context and route params', async () => {
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
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    // Navigate to the route with parameters
    window.history.pushState({}, '', '/app/play/run/frankenstein/victor-frankenstein');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(mockFetchJson).toHaveBeenCalledWith(
        '/api/storyrunner/start',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storySlug: 'frankenstein',
            characterId: 'victor-frankenstein',
            toneStyleId: 'drama',
            timeFlavorId: 'today'
          })
        })
      );
    });

    // Verify console log was called
    expect(console.log).toHaveBeenCalledWith(
      '🧠 Starting story session with payload:',
      {
        storySlug: 'frankenstein',
        characterId: 'victor-frankenstein',
        toneStyleId: 'drama',
        timeFlavorId: 'today'
      }
    );
  });

  it('should use fallback values when context is missing', async () => {
    // Mock context with missing values
    const { useStorySettingsContext } = require('../components/ui/storySettings/StorySettingsProvider');
    useStorySettingsContext.mockReturnValueOnce({
      selectedToneStyle: null,
      selectedTimeFlavor: null,
      availableToneStyles: [],
      availableTimeFlavors: [],
      savedPreferences: null,
      isLoading: false,
      isSaving: false,
      error: null,
      setSelectedToneStyle: jest.fn(),
      setSelectedTimeFlavor: jest.fn(),
      savePreferences: jest.fn(),
      loadUserPreferences: jest.fn(),
      resetToDefaults: jest.fn(),
    });

    mockFetchJson.mockResolvedValueOnce({
      ok: true,
      sessionId: 'session-123',
      firstMessage: { id: 'msg-1', role: 'assistant', content: 'Welcome!', metadata: { chapter: 1, beat: 1 } },
      story: { title: 'Frankenstein', slug: 'frankenstein', character: { id: 'victor', name: 'Victor', displayName: 'Victor' } },
      settings: { toneStyle: 'drama', timeFlavor: 'today' }
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/app/play/run/frankenstein/victor-frankenstein');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(mockFetchJson).toHaveBeenCalledWith(
        '/api/storyrunner/start',
        expect.objectContaining({
          body: JSON.stringify({
            storySlug: 'frankenstein',
            characterId: 'victor-frankenstein',
            toneStyleId: 'drama', // fallback
            timeFlavorId: 'today'  // fallback
          })
        })
      );
    });
  });

  it('should handle authentication errors properly', async () => {
    // Mock 401 Unauthorized response
    const authError = new Error('HTTP 401: Unauthorized');
    (authError as any).status = 401;
    mockFetchJson.mockRejectedValueOnce(authError);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/app/play/run/frankenstein/victor-frankenstein');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toHaveTextContent('HTTP 401: Unauthorized');
    });
  });

  it('should include credentials in all requests', async () => {
    mockFetchJson.mockResolvedValueOnce({
      ok: true,
      sessionId: 'session-123',
      firstMessage: { id: 'msg-1', role: 'assistant', content: 'Welcome!', metadata: { chapter: 1, beat: 1 } },
      story: { title: 'Frankenstein', slug: 'frankenstein', character: { id: 'victor', name: 'Victor', displayName: 'Victor' } },
      settings: { toneStyle: 'drama', timeFlavor: 'today' }
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/app/play/run/frankenstein/victor-frankenstein');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(mockFetchJson).toHaveBeenCalledWith(
        '/api/storyrunner/start',
        expect.objectContaining({
          credentials: 'include'
        })
      );
    });
  });
});
