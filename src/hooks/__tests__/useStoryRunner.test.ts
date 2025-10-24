import { renderHook, act } from '@testing-library/react';
import { useStoryRunner, StoryContext } from '../useStoryRunner';

// Mock fetchJson
jest.mock('../../lib/http', () => ({
  fetchJson: jest.fn()
}));

const mockFetchJson = require('../../lib/http').fetchJson;

describe('useStoryRunner', () => {
  const mockContext: StoryContext = {
    story: {
      title: 'Test Story',
      storyrunner: {
        storyPrompt: 'You are a creative storyteller.'
      }
    },
    character: {
      name: 'Test Character',
      displayName: 'Test Character'
    },
    toneStyle: {
      id: 'original',
      label: 'Original'
    },
    timeFlavor: {
      id: 'original',
      label: 'Original'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should build system prompt correctly', () => {
    const { result } = renderHook(() => useStoryRunner());
    
    const systemPromptResult = result.current.buildSystemPrompt(mockContext);
    
    expect(systemPromptResult.systemPrompt).toContain('Test Story');
    expect(systemPromptResult.systemPrompt).toContain('Test Character');
    expect(systemPromptResult.systemPrompt).toContain('Original');
    expect(systemPromptResult.systemPrompt).toContain('You are a creative storyteller.');
    expect(systemPromptResult.systemPrompt).toContain('JSON format');
    
    expect(systemPromptResult.contextPayload).toEqual({
      storyTitle: 'Test Story',
      characterName: 'Test Character',
      toneStyle: 'Original',
      timeFlavor: 'Original',
      storyPrompt: 'You are a creative storyteller.'
    });
  });

  it('should parse GPT response correctly', () => {
    const { result } = renderHook(() => useStoryRunner());
    
    const validResponse = JSON.stringify({
      chapter: 2,
      beat: 3,
      content: 'The story continues...',
      choices: [
        { id: 'choice_1', text: 'Continue forward' },
        { id: 'choice_2', text: 'Turn back' }
      ]
    });

    const parsed = result.current.parseGPTResponse(validResponse);
    
    expect(parsed.chapter).toBe(2);
    expect(parsed.beat).toBe(3);
    expect(parsed.content).toBe('The story continues...');
    expect(parsed.choices).toHaveLength(2);
    expect(parsed.choices[0]).toEqual({ id: 'choice_1', text: 'Continue forward' });
  });

  it('should handle invalid JSON response with fallback', () => {
    const { result } = renderHook(() => useStoryRunner());
    
    const invalidResponse = 'This is not JSON';
    const parsed = result.current.parseGPTResponse(invalidResponse);
    
    expect(parsed.chapter).toBe(1);
    expect(parsed.beat).toBe(1);
    expect(parsed.content).toBe('This is not JSON');
    expect(parsed.choices).toEqual(['Continue', 'Explore', 'Ask questions']);
  });

  it('should process turn with context successfully', async () => {
    const mockResponse = {
      ok: true,
      sessionId: 'session-123',
      assistantMessage: {
        id: 'msg-1',
        role: 'assistant',
        content: JSON.stringify({
          chapter: 1,
          beat: 2,
          content: 'Welcome to the story!',
          choices: [{ id: 'choice_1', text: 'Begin adventure' }]
        }),
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

    mockFetchJson.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useStoryRunner());

    await act(async () => {
      const response = await result.current.processTurn({
        sessionId: 'session-123',
        userMessage: 'Hello',
        context: mockContext
      });
      
      expect(response).toBeTruthy();
      expect(response?.assistantMessage.content).toBe('Welcome to the story!');
      expect(response?.assistantMessage.choices).toEqual([{ id: 'choice_1', text: 'Begin adventure' }]);
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle processing error', async () => {
    mockFetchJson.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useStoryRunner());

    await act(async () => {
      const response = await result.current.processTurn({
        sessionId: 'session-123',
        userMessage: 'Hello'
      });
      
      expect(response).toBeNull();
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useStoryRunner());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
