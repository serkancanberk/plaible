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

describe('Character Slug Resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock alert
    global.alert = jest.fn();
  });

  it('should resolve character by slug when slug field exists', async () => {
    // Mock story data with character slugs
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
        },
        {
          id: 'chr_victor',
          slug: 'victor-frankenstein',
          name: 'Victor Frankenstein',
          displayName: 'Victor'
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
          id: 'chr_creature',
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
            characterId: 'chr_creature', // Should use character.id
            toneStyleId: 'drama',
            timeFlavorId: 'today'
          })
        })
      );
    });

    // Verify console log shows slug resolution
    expect(console.log).toHaveBeenCalledWith('✅ Character resolved by: slug');
  });

  it('should resolve character by name fallback when slug field is missing', async () => {
    // Mock story data without character slugs (old format)
    const mockStory = {
      _id: '6528ff2e8a9c3a1234567890',
      title: 'Frankenstein',
      slug: 'frankenstein',
      characters: [
        {
          id: 'chr_creature',
          // No slug field
          name: 'The Creature',
          displayName: 'The Creature'
        },
        {
          id: 'chr_victor',
          // No slug field
          name: 'Victor Frankenstein',
          displayName: 'Victor'
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
          body: JSON.stringify({
            storySlug: 'frankenstein',
            characterId: 'chr_creature',
            toneStyleId: 'drama',
            timeFlavorId: 'today'
          })
        })
      );
    });

    // Verify console log shows name fallback resolution
    expect(console.log).toHaveBeenCalledWith('✅ Character resolved by: name fallback');
  });

  it('should handle character not found gracefully', async () => {
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

  it('should try multiple fallback methods for character resolution', async () => {
    // Mock story data with character that has different name format
    const mockStory = {
      _id: '6528ff2e8a9c3a1234567890',
      title: 'Frankenstein',
      slug: 'frankenstein',
      characters: [
        {
          id: 'chr_creature',
          // No slug field
          name: 'The Creature',
          displayName: 'The Creature'
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

    // Test with different character slug formats
    const testCases = [
      { characterSlug: 'the-creature', expectedId: 'chr_creature' },
      { characterSlug: 'the creature', expectedId: 'chr_creature' },
    ];

    for (const testCase of testCases) {
      jest.clearAllMocks();
      mockFetchJson
        .mockResolvedValueOnce(mockStory)
        .mockResolvedValueOnce(mockSessionResponse);

      window.history.pushState({}, '', `/app/play/run/frankenstein/${testCase.characterSlug}`);
      
      const startButton = screen.getByText('Start Session');
      startButton.click();

      await waitFor(() => {
        expect(mockFetchJson).toHaveBeenCalledWith(
          '/api/storyrunner/start',
          expect.objectContaining({
            body: JSON.stringify({
              storySlug: 'frankenstein',
              characterId: testCase.expectedId,
              toneStyleId: 'drama',
              timeFlavorId: 'today'
            })
          })
        );
      });
    }
  });
});
