import { describe, test, expect } from '@jest/globals';
import { localModeration } from '../moderation.js';

describe('Moderation Local Regex', () => {
  test('should block harmful phrases', () => {
    const harmfulPhrases = [
      'I want to kill myself',
      'I want to end my life',
      'I want to harm myself',
      'I want to commit suicide',
      'I want to self-harm',
      'This is about rape',
      'This is child porn',
      'I am a nazi',
      'This is a terrorist attack',
      'This is a bomb threat'
    ];

    harmfulPhrases.forEach(phrase => {
      const result = localModeration(phrase);
      expect(result).toEqual({
        ok: false,
        code: 'MODERATION_BLOCKED'
      });
    });
  });

  test('should allow benign text', () => {
    const benignTexts = [
      'Hello, how are you?',
      'I love this story',
      'Can you help me with my homework?',
      'The weather is nice today',
      'I want to learn programming',
      'This is a great book',
      'I enjoy reading',
      'Let me know if you need help',
      'Thanks for your assistance',
      'Have a great day!'
    ];

    benignTexts.forEach(text => {
      const result = localModeration(text);
      expect(result).toEqual({ ok: true });
    });
  });

  test('should handle edge cases', () => {
    // Test with null/undefined
    expect(localModeration(null)).toEqual({ ok: true });
    expect(localModeration(undefined)).toEqual({ ok: true });
    expect(localModeration('')).toEqual({ ok: true });
    expect(localModeration(123)).toEqual({ ok: true });
    expect(localModeration({})).toEqual({ ok: true });
  });

  test('should be case insensitive', () => {
    const harmfulPhrases = [
      'I WANT TO KILL MYSELF',
      'i want to kill myself',
      'I Want To Kill Myself',
      'I WANT TO KILL MYSELF!!!'
    ];

    harmfulPhrases.forEach(phrase => {
      const result = localModeration(phrase);
      expect(result).toEqual({
        ok: false,
        code: 'MODERATION_BLOCKED'
      });
    });
  });

  test('should handle partial matches correctly', () => {
    // These should be blocked (exact word matches)
    expect(localModeration('I want to kill myself')).toEqual({
      ok: false,
      code: 'MODERATION_BLOCKED'
    });

    // These should be allowed (not exact word matches)
    expect(localModeration('I want to kill time')).toEqual({ ok: true });
    expect(localModeration('myself is a word')).toEqual({ ok: true });
  });
});
