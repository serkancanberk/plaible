import { renderHook, act } from '@testing-library/react';
import { useStorySession } from '../useStorySession';

// Mock fetchJson
jest.mock('../../lib/http', () => ({
  fetchJson: jest.fn()
}));

const mockFetchJson = require('../../lib/http').fetchJson;

describe('useStorySession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with null session', () => {
    const { result } = renderHook(() => useStorySession());
    
    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should start session successfully', async () => {
    const mockResponse = {
      ok: true,
      sessionId: 'session-123',
      firstMessage: {
        id: 'msg-1',
        role: 'assistant' as const,
        content: 'Welcome to your story!',
        choices: ['Continue', 'Explore'],
        metadata: {
          chapter: 1,
          beat: 1
        }
      },
      story: {
        title: 'Test Story',
        slug: 'test-story',
        character: {
          id: 'char-1',
          name: 'Test Character',
          displayName: 'Test Character'
        }
      },
      settings: {
        toneStyle: 'original',
        timeFlavor: 'original'
      }
    };

    mockFetchJson.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useStorySession());

    await act(async () => {
      await result.current.startSession({
        storySlug: 'test-story',
        characterId: 'char-1',
        toneStyleId: 'original',
        timeFlavorId: 'original'
      });
    });

    expect(result.current.session).toEqual(mockResponse);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle session start error', async () => {
    mockFetchJson.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useStorySession());

    await act(async () => {
      try {
        await result.current.startSession({
          storySlug: 'test-story',
          characterId: 'char-1',
          toneStyleId: 'original',
          timeFlavorId: 'original'
        });
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should clear session', () => {
    const { result } = renderHook(() => useStorySession());

    act(() => {
      result.current.clearSession();
    });

    expect(result.current.session).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
