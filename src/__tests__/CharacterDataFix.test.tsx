import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoryHeader } from '../components/ui/chat/StoryHeader';
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
  const { startSession, session, isLoading, error } = useStorySession();
  
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
      {session && (
        <StoryHeader
          story={session.story}
          character={session.story.character}
          toneStyle={{ id: 'drama', label: 'Drama' }}
          timeFlavor={{ id: 'today', label: 'Today' }}
        />
      )}
    </div>
  );
}

describe('Character Data Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock alert
    global.alert = jest.fn();
  });

  it('should render StoryHeader with complete character data', async () => {
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

    // Mock session response with complete character data
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
          slug: 'the-creature',
          name: 'The Creature',
          displayName: 'The Creature',
          assets: {}
        }
      },
      settings: { toneStyle: 'drama', timeFlavor: 'today' }
    };

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
      expect(screen.getByText('Playing as The Creature')).toBeInTheDocument();
      expect(screen.getByText('in the Drama theme')).toBeInTheDocument();
      expect(screen.getByText('set in Today time.')).toBeInTheDocument();
    });

    // Should not show error
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle missing character data gracefully', async () => {
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

    // Mock session response with missing character data
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
        slug: 'frankenstein'
        // Missing character object
      },
      settings: { toneStyle: 'drama', timeFlavor: 'today' }
    };

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

    window.history.pushState({}, '', '/app/play/run/frankenstein/the-creature');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(screen.getByText('Loading character...')).toBeInTheDocument();
    });

    // Should not crash with missing character data
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle partial character data with fallbacks', async () => {
    // Mock story data
    const mockStory = {
      _id: '6528ff2e8a9c3a1234567890',
      title: 'Frankenstein',
      slug: 'frankenstein',
      characters: [
        {
          id: 'chr_creature',
          slug: 'the-creature',
          name: 'The Creature'
          // Missing displayName
        }
      ]
    };

    // Mock session response with partial character data
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
          slug: 'the-creature',
          name: 'The Creature',
          displayName: 'The Creature', // Fallback from name
          assets: {}
        }
      },
      settings: { toneStyle: 'drama', timeFlavor: 'today' }
    };

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

    window.history.pushState({}, '', '/app/play/run/frankenstein/the-creature');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(screen.getByText('Playing as The Creature')).toBeInTheDocument();
      expect(screen.getByText('in the Drama theme')).toBeInTheDocument();
      expect(screen.getByText('set in Today time.')).toBeInTheDocument();
    });

    // Should not show error for partial character data
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle completely missing character data with fallbacks', async () => {
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

    // Mock session response with completely missing character data
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
          slug: 'unknown',
          name: 'Unknown Character',
          displayName: 'Unknown Character',
          assets: {}
        }
      },
      settings: { toneStyle: 'drama', timeFlavor: 'today' }
    };

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

    window.history.pushState({}, '', '/app/play/run/frankenstein/the-creature');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(screen.getByText('Playing as Unknown Character')).toBeInTheDocument();
      expect(screen.getByText('in the Drama theme')).toBeInTheDocument();
      expect(screen.getByText('set in Today time.')).toBeInTheDocument();
    });

    // Should not show error for missing character data with fallbacks
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle missing toneStyle and timeFlavor gracefully', async () => {
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

    // Mock session response with complete character data
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
          slug: 'the-creature',
          name: 'The Creature',
          displayName: 'The Creature',
          assets: {}
        }
      },
      settings: { toneStyle: 'drama', timeFlavor: 'today' }
    };

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

    window.history.pushState({}, '', '/app/play/run/frankenstein/the-creature');
    
    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(screen.getByText('Playing as The Creature')).toBeInTheDocument();
      expect(screen.getByText('in the Unknown theme')).toBeInTheDocument();
      expect(screen.getByText('set in Unknown time.')).toBeInTheDocument();
    });

    // Should not show error for missing toneStyle and timeFlavor
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });
});
