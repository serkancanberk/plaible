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

describe('Duplicate Session Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock alert
    global.alert = jest.fn();
  });

  it('should reuse existing session when one exists', async () => {
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

    // Mock existing session response (session reuse)
    const mockExistingSessionResponse = {
      ok: true,
      sessionId: 'existing-session-123',
      story: { 
        title: 'Frankenstein', 
        slug: 'frankenstein', 
        character: { 
          id: 'chr_creature', 
          name: 'The Creature', 
          displayName: 'The Creature' 
        } 
      },
      scene: { 
        text: 'Welcome back to the story!', 
        choices: ['Continue', 'Restart'] 
      },
      progress: { chapter: 2, completed: false },
      wallet: { balance: 90 }
    };

    mockFetchJson
      .mockResolvedValueOnce(mockStory) // First call: fetch story
      .mockResolvedValueOnce(mockExistingSessionResponse); // Second call: start session (reuses existing)

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
      expect(mockFetchJson).toHaveBeenCalledWith('/api/stories/frankenstein');
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

    // Should not show error for existing session reuse
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle duplicate key error gracefully', async () => {
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

    // Mock duplicate key error response
    const duplicateError = new Error('E11000 duplicate key error');
    (duplicateError as any).code = 11000;
    (duplicateError as any).status = 500;
    (duplicateError as any).response = {
      error: 'DUPLICATE_SESSION',
      message: 'Session already exists',
      details: 'A session for this user and story already exists'
    };

    mockFetchJson
      .mockResolvedValueOnce(mockStory) // First call: fetch story
      .mockRejectedValueOnce(duplicateError); // Second call: start session fails with duplicate

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
      expect(screen.getByTestId('error')).toHaveTextContent('E11000 duplicate key error');
    });
  });

  it('should create new session when none exists', async () => {
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

    // Mock new session response
    const mockNewSessionResponse = {
      ok: true,
      sessionId: 'new-session-456',
      story: { 
        title: 'Frankenstein', 
        slug: 'frankenstein', 
        character: { 
          id: 'chr_creature', 
          name: 'The Creature', 
          displayName: 'The Creature' 
        } 
      },
      scene: { 
        text: 'Welcome to the story!', 
        choices: ['Begin', 'Learn More'] 
      },
      progress: { chapter: 1, completed: false },
      wallet: { balance: 90 }
    };

    mockFetchJson
      .mockResolvedValueOnce(mockStory) // First call: fetch story
      .mockResolvedValueOnce(mockNewSessionResponse); // Second call: start session (creates new)

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
      expect(mockFetchJson).toHaveBeenCalledWith('/api/stories/frankenstein');
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

    // Should not show error for new session creation
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle session creation failure gracefully', async () => {
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

    // Mock session creation failure
    const sessionError = new Error('Database connection failed');
    (sessionError as any).status = 500;
    (sessionError as any).response = {
      error: 'SESSION_CREATION_ERROR',
      message: 'Database connection failed',
      details: 'Unable to create new session'
    };

    mockFetchJson
      .mockResolvedValueOnce(mockStory) // First call: fetch story
      .mockRejectedValueOnce(sessionError); // Second call: start session fails

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
      expect(screen.getByTestId('error')).toHaveTextContent('Database connection failed');
    });
  });

  it('should handle concurrent session creation attempts', async () => {
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

    // Mock concurrent session creation (first attempt fails with duplicate, second succeeds)
    const duplicateError = new Error('E11000 duplicate key error');
    (duplicateError as any).code = 11000;
    
    const mockSessionResponse = {
      ok: true,
      sessionId: 'concurrent-session-789',
      story: { 
        title: 'Frankenstein', 
        slug: 'frankenstein', 
        character: { 
          id: 'chr_creature', 
          name: 'The Creature', 
          displayName: 'The Creature' 
        } 
      },
      scene: { 
        text: 'Welcome to the story!', 
        choices: ['Begin', 'Learn More'] 
      },
      progress: { chapter: 1, completed: false },
      wallet: { balance: 90 }
    };

    mockFetchJson
      .mockResolvedValueOnce(mockStory) // First call: fetch story
      .mockRejectedValueOnce(duplicateError) // Second call: first attempt fails with duplicate
      .mockResolvedValueOnce(mockSessionResponse); // Third call: retry succeeds

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
      expect(mockFetchJson).toHaveBeenCalledWith('/api/stories/frankenstein');
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

    // Should handle concurrent creation gracefully
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });
});
