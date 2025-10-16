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

describe('StoryRunner ID Mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock alert
    global.alert = jest.fn();
  });

  it('should map slugs to IDs correctly', async () => {
    // Mock story data with character
    const mockStory = {
      _id: '6528ff2e8a9c3a1234567890',
      title: 'Frankenstein',
      slug: 'frankenstein',
      characters: [
        {
          id: 'char-123',
          slug: 'the-creature',
          name: 'The Creature',
          displayName: 'The Creature'
        }
      ]
    };

    // Mock successful storyrunner start response
    const mockSessionResponse = {
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
          id: 'char-123',
          name: 'The Creature',
          displayName: 'The Creature'
        }
      },
      settings: {
        toneStyle: 'drama',
        timeFlavor: 'today'
      }
    };

    // Setup fetchJson mocks
    mockFetchJson
      .mockResolvedValueOnce(mockStory) // First call: fetch story
      .mockResolvedValueOnce(mockSessionResponse); // Second call: start session

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
      // Verify story was fetched first
      expect(mockFetchJson).toHaveBeenCalledWith('/api/stories/frankenstein');
      
      // Verify session start was called with correct payload
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
            characterId: 'char-123', // Mapped from slug to ID
            toneStyleId: 'drama',
            timeFlavorId: 'today'
          })
        })
      );
    });

    // Verify console log was called with correct payload
    expect(console.log).toHaveBeenCalledWith(
      '🧠 Starting story session with payload:',
      {
        storySlug: 'frankenstein',
        characterId: 'char-123', // Should be the character ID, not slug
        toneStyleId: 'drama',
        timeFlavorId: 'today'
      }
    );
  });

  it('should handle story not found gracefully', async () => {
    // Mock story not found
    mockFetchJson.mockRejectedValueOnce(new Error('Story not found'));

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

  it('should handle character not found gracefully', async () => {
    // Mock story data without the requested character
    const mockStory = {
      _id: '6528ff2e8a9c3a1234567890',
      title: 'Frankenstein',
      slug: 'frankenstein',
      characters: [
        {
          id: 'char-123',
          slug: 'victor-frankenstein', // Different character
          name: 'Victor Frankenstein',
          displayName: 'Victor'
        }
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

    const mockStory = {
      _id: '6528ff2e8a9c3a1234567890',
      title: 'Frankenstein',
      slug: 'frankenstein',
      characters: [
        {
          id: 'char-123',
          slug: 'the-creature',
          name: 'The Creature',
          displayName: 'The Creature'
        }
      ]
    };

    const mockSessionResponse = {
      ok: true,
      sessionId: 'session-123',
      firstMessage: { id: 'msg-1', role: 'assistant', content: 'Welcome!', metadata: { chapter: 1, beat: 1 } },
      story: { title: 'Frankenstein', slug: 'frankenstein', character: { id: 'char-123', name: 'The Creature', displayName: 'The Creature' } },
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
          body: JSON.stringify({
            storySlug: 'frankenstein',
            characterId: 'char-123',
            toneStyleId: 'drama', // fallback
            timeFlavorId: 'today'  // fallback
          })
        })
      );
    });
  });

  it('should include credentials in all requests', async () => {
    const mockStory = {
      _id: '6528ff2e8a9c3a1234567890',
      title: 'Frankenstein',
      slug: 'frankenstein',
      characters: [
        {
          id: 'char-123',
          slug: 'the-creature',
          name: 'The Creature',
          displayName: 'The Creature'
        }
      ]
    };

    const mockSessionResponse = {
      ok: true,
      sessionId: 'session-123',
      firstMessage: { id: 'msg-1', role: 'assistant', content: 'Welcome!', metadata: { chapter: 1, beat: 1 } },
      story: { title: 'Frankenstein', slug: 'frankenstein', character: { id: 'char-123', name: 'The Creature', displayName: 'The Creature' } },
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
      // Verify both requests include credentials
      expect(mockFetchJson).toHaveBeenCalledWith('/api/stories/frankenstein', expect.objectContaining({
        credentials: 'include'
      }));
      expect(mockFetchJson).toHaveBeenCalledWith('/api/storyrunner/start', expect.objectContaining({
        credentials: 'include'
      }));
    });
  });
});
