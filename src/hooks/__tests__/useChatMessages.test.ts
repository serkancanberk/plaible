import { renderHook, act } from '@testing-library/react';
import { useChatMessages } from '../useChatMessages';

// Mock fetchJson
jest.mock('../../lib/http', () => ({
  fetchJson: jest.fn()
}));

const mockFetchJson = require('../../lib/http').fetchJson;

describe('useChatMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useChatMessages(null));
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch messages when sessionId is provided', async () => {
    const mockResponse = {
      ok: true,
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Welcome!',
          choices: ['Continue'],
          metadata: { chapter: 1, beat: 1 },
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ],
      pagination: {
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false
      }
    };

    mockFetchJson.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useChatMessages('session-123'));

    await act(async () => {
      // Wait for useEffect to trigger
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Welcome!');
    expect(result.current.isLoading).toBe(false);
  });

  it('should send message successfully', async () => {
    const mockTurnResponse = {
      ok: true,
      sessionId: 'session-123',
      assistantMessage: {
        id: 'msg-2',
        role: 'assistant',
        content: 'Great choice!',
        choices: ['Continue'],
        metadata: {
          chapter: 1,
          beat: 2,
          tokenUsage: { prompt: 10, completion: 5, total: 15 },
          latency: 1000
        }
      },
      progress: {
        chapter: 1,
        beat: 2,
        completed: false
      }
    };

    mockFetchJson.mockResolvedValue(mockTurnResponse);

    const { result } = renderHook(() => useChatMessages('session-123'));

    await act(async () => {
      await result.current.sendMessage('Hello!');
    });

    expect(result.current.messages).toHaveLength(2); // User message + assistant response
    expect(result.current.messages[0].content).toBe('Hello!');
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[1].content).toBe('Great choice!');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.isSending).toBe(false);
  });

  it('should handle send message error', async () => {
    mockFetchJson.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useChatMessages('session-123'));

    await act(async () => {
      await result.current.sendMessage('Hello!');
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isSending).toBe(false);
  });
});
