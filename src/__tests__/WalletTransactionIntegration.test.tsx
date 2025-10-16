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

describe('WalletTransaction Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock alert
    global.alert = jest.fn();
  });

  it('should handle successful wallet transaction creation', async () => {
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

    // Mock successful session response
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

    // Should not show error for successful wallet transaction
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle wallet transaction error with specific error message', async () => {
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

    // Mock wallet transaction error
    const walletError = new Error('Insufficient balance for deduction');
    (walletError as any).status = 500;
    (walletError as any).response = {
      error: 'WALLET_TRANSACTION_ERROR',
      message: 'Insufficient balance for deduction',
      details: 'Unable to deduct credits for story session'
    };

    mockFetchJson
      .mockResolvedValueOnce(mockStory) // First call: fetch story
      .mockRejectedValueOnce(walletError); // Second call: start session fails

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
      expect(screen.getByTestId('error')).toHaveTextContent('Insufficient balance for deduction');
    });
  });

  it('should handle duplicate transaction gracefully', async () => {
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

    // Mock successful session response (duplicate transaction should be handled gracefully)
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
      settings: { toneStyle: 'drama', timeFlavor: 'today' }
    };

    mockFetchJson
      .mockResolvedValueOnce(mockStory) // First call: fetch story
      .mockResolvedValueOnce(mockSessionResponse); // Second call: start session (duplicate handled)

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

    // Should not show error for duplicate transaction (handled gracefully)
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle user not found error in wallet transaction', async () => {
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

    // Mock user not found error
    const userNotFoundError = new Error('User not found');
    (userNotFoundError as any).status = 500;
    (userNotFoundError as any).response = {
      error: 'WALLET_TRANSACTION_ERROR',
      message: 'User not found',
      details: 'Unable to process wallet transaction'
    };

    mockFetchJson
      .mockResolvedValueOnce(mockStory) // First call: fetch story
      .mockRejectedValueOnce(userNotFoundError); // Second call: start session fails

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
      expect(screen.getByTestId('error')).toHaveTextContent('User not found');
    });
  });

  it('should handle database connection error in wallet transaction', async () => {
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

    // Mock database connection error
    const dbError = new Error('Database connection failed');
    (dbError as any).status = 500;
    (dbError as any).response = {
      error: 'WALLET_TRANSACTION_ERROR',
      message: 'Database connection failed',
      details: 'Unable to save wallet transaction'
    };

    mockFetchJson
      .mockResolvedValueOnce(mockStory) // First call: fetch story
      .mockRejectedValueOnce(dbError); // Second call: start session fails

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
});
