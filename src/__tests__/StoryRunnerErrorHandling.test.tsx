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

describe('StoryRunner Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock alert
    global.alert = jest.fn();
  });

  it('should handle 500 server error with detailed logging', async () => {
    // Mock story data
    const mockStory = {
      _id: '6528ff2e8a9c3a1234567890',
      title: 'Frankenstein',
      slug: 'frankenstein',
      characters: [
        {
          id: 'chr_creature',
          slug: 'the-creature',
          name: 'The Creature',
          displayName: 'The Creature'
        }
      ]
    };

    // Mock 500 server error response
    const serverError = new Error('Cannot read properties of undefined (reading \'prompt\')');
    (serverError as any).status = 500;
    mockFetchJson
      .mockResolvedValueOnce(mockStory) // First call: fetch story
      .mockRejectedValueOnce(serverError); // Second call: start session fails

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    // Navigate to the route with parameters
    window.history.pushState({}, '', '/app/play/run/frankenstein/the-creature');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toHaveTextContent('Cannot read properties of undefined');
    });

    // Verify that the story was fetched first
    expect(mockFetchJson).toHaveBeenCalledWith('/api/stories/frankenstein');
  });

  it('should handle story not found error', async () => {
    // Mock story not found
    const notFoundError = new Error('Story not found');
    (notFoundError as any).status = 404;
    mockFetchJson.mockRejectedValueOnce(notFoundError);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/app/play/run/frankenstein/the-creature');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toHaveTextContent('Story not found');
    });
  });

  it('should handle character not found error', async () => {
    // Mock story data without the requested character
    const mockStory = {
      _id: '6528ff2e8a9c3a1234567890',
      title: 'Frankenstein',
      slug: 'frankenstein',
      characters: [
        {
          id: 'chr_victor',
          slug: 'victor-frankenstein',
          name: 'Victor Frankenstein',
          displayName: 'Victor'
        }
        // Missing 'the-creature' character
      ]
    };

    mockFetchJson.mockResolvedValueOnce(mockStory);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/app/play/run/frankenstein/the-creature');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        'Story data could not be resolved. Please reselect your character.'
      );
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toHaveTextContent('Story data could not be resolved');
    });
  });

  it('should handle missing data warnings gracefully', async () => {
    // Mock story data with missing content/personality
    const mockStory = {
      _id: '6528ff2e8a9c3a1234567890',
      title: 'Frankenstein',
      slug: 'frankenstein',
      // Missing content and storyrunner.storyPrompt
      characters: [
        {
          id: 'chr_creature',
          slug: 'the-creature',
          name: 'The Creature',
          displayName: 'The Creature'
          // Missing personality and summary
        }
      ]
    };

    const mockSessionResponse = {
      ok: true,
      sessionId: 'session-123',
      firstMessage: { id: 'msg-1', role: 'assistant', content: 'Welcome!', metadata: { chapter: 1, beat: 1 } },
      story: { title: 'Frankenstein', slug: 'frankenstein', character: { id: 'chr_creature', name: 'The Creature', displayName: 'The Creature' } },
      settings: { toneStyle: 'drama', timeFlavor: 'today' }
    };

    mockFetchJson
      .mockResolvedValueOnce(mockStory)
      .mockResolvedValueOnce(mockSessionResponse);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/app/play/run/frankenstein/the-creature');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(mockFetchJson).toHaveBeenCalledWith(
        '/api/storyrunner/start',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            storySlug: 'frankenstein',
            characterId: 'chr_creature',
            toneStyleId: 'drama',
            timeFlavorId: 'today'
          })
        })
      );
    });

    // Should not show error for missing data warnings
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should provide detailed error information for debugging', async () => {
    // Mock a specific error that would trigger the detailed error handling
    const detailedError = new Error('Cannot read properties of undefined (reading \'prompt\')');
    (detailedError as any).status = 500;
    
    const mockStory = {
      _id: '6528ff2e8a9c3a1234567890',
      title: 'Frankenstein',
      slug: 'frankenstein',
      characters: [
        {
          id: 'chr_creature',
          slug: 'the-creature',
          name: 'The Creature',
          displayName: 'The Creature'
        }
      ]
    };

    mockFetchJson
      .mockResolvedValueOnce(mockStory)
      .mockRejectedValueOnce(detailedError);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/app/play/run/frankenstein/the-creature');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toHaveTextContent('Cannot read properties of undefined');
    });
  });
});
