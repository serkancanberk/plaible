import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useStorySession } from '../hooks/useStorySession';
import { fetchJson } from '../lib/http';

// Mock the fetchJson utility
jest.mock('../lib/http', () => ({
  fetchJson: jest.fn(),
}));

const mockFetchJson = fetchJson as jest.Mock;

// Mock component to test the hook
function TestComponent() {
  const { startSession, isLoading, error } = useStorySession();
  
  const handleStart = async () => {
    try {
      await startSession({
        storySlug: 'frankenstein',
        characterId: 'victor-frankenstein',
        toneStyleId: 'drama',
        timeFlavorId: 'today'
      });
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

describe('StoryRunner Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include credentials in API calls', async () => {
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
        <TestComponent />
      </BrowserRouter>
    );

    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(mockFetchJson).toHaveBeenCalledWith(
        '/api/storyrunner/start',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: expect.stringContaining('"storyId":"frankenstein"')
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
        <TestComponent />
      </BrowserRouter>
    );

    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toHaveTextContent('HTTP 401: Unauthorized');
    });
  });

  it('should send correct request body with all required fields', async () => {
    mockFetchJson.mockResolvedValueOnce({
      ok: true,
      sessionId: 'session-123',
      firstMessage: { id: 'msg-1', role: 'assistant', content: 'Welcome!', metadata: { chapter: 1, beat: 1 } },
      story: { title: 'Frankenstein', slug: 'frankenstein', character: { id: 'victor', name: 'Victor', displayName: 'Victor' } },
      settings: { toneStyle: 'drama', timeFlavor: 'today' }
    });

    render(
      <BrowserRouter>
        <TestComponent />
      </BrowserRouter>
    );

    const startButton = screen.getByText('Start Session');
    startButton.click();

    await waitFor(() => {
      expect(mockFetchJson).toHaveBeenCalledWith(
        '/api/storyrunner/start',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            userId: '64b7cafe1234567890cafe12',
            storyId: 'frankenstein',
            characterId: 'victor-frankenstein',
            toneStyleId: 'drama',
            timeFlavorId: 'today'
          })
        })
      );
    });
  });
});
