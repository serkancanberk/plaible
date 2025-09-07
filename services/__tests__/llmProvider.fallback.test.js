import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateTurn } from '../llmProvider.js';

// Mock environment variables
const originalEnv = process.env;

describe('LLM Provider Fallback', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  test('should fallback to mock when LLM_PROVIDER=openai but no OPENAI_API_KEY', async () => {
    // Set up environment to trigger fallback
    process.env.LLM_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;

    // Mock story and session data
    const mockStory = {
      _id: 'story_123',
      title: 'Test Story',
      characters: [{ id: 'chr_test', name: 'Test Character' }]
    };

    const mockSession = {
      _id: 'session_123',
      log: [
        { role: 'storyrunner', content: 'Initial scene', choices: ['Choice 1', 'Choice 2'] }
      ],
      progress: { chapter: 1, completed: false }
    };

    const mockChosen = 'Choice 1';
    const mockFreeText = 'Some user input';

    // Should not throw and should return expected shape
    const result = await generateTurn({
      story: mockStory,
      session: mockSession,
      chosen: mockChosen,
      freeText: mockFreeText
    });

    // Assert the result has the expected shape
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('choices');
    expect(typeof result.text).toBe('string');
    expect(Array.isArray(result.choices)).toBe(true);
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.choices.length).toBeGreaterThan(0);
  });

  test('should never throw even with invalid inputs', async () => {
    // Set up environment to trigger fallback
    process.env.LLM_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;

    // Test with minimal/invalid inputs
    const result = await generateTurn({
      story: { characters: [] },
      session: { log: [] },
      chosen: null,
      freeText: null
    });

    // Should still return expected shape
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('choices');
    expect(typeof result.text).toBe('string');
    expect(Array.isArray(result.choices)).toBe(true);
  });
});
