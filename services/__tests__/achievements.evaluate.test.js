import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock mongoose completely
jest.unstable_mockModule('mongoose', () => ({
  default: {},
  Schema: class {},
  models: {},
  model: () => ({}),
  Types: { 
    ObjectId: class { 
      toString() { return '507f1f77bcf86cd799439011'; } 
    } 
  }
}));

// Mock models
const mockAchievementFind = jest.fn();
const mockUserAchievementUpdateOne = jest.fn();
const mockSessionFind = jest.fn();

jest.unstable_mockModule('../../models/Achievement.js', () => ({
  Achievement: {
    find: jest.fn().mockReturnValue({
      lean: mockAchievementFind
    })
  }
}));

jest.unstable_mockModule('../../models/UserAchievement.js', () => ({
  UserAchievement: {
    updateOne: mockUserAchievementUpdateOne
  }
}));

jest.unstable_mockModule('../../models/Session.js', () => ({
  Session: {
    find: jest.fn().mockReturnValue({
      lean: mockSessionFind
    })
  }
}));

// Mock eventLog
jest.unstable_mockModule('../eventLog.js', () => ({
  logEvent: jest.fn().mockResolvedValue(true)
}));

describe('Achievements Evaluate', () => {
  let evaluateAndUnlock;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Import the service after mocking
    const achievementsModule = await import('../achievements.js');
    evaluateAndUnlock = achievementsModule.evaluateAndUnlock;
  });

  test('should unlock achievement once and be idempotent', async () => {
    const userId = 'user123';
    const storyId = 'story_dorian_gray';
    const sessionId = 'session123';

    // Mock achievement with completionCount rule
    const mockAchievement = {
      code: 'first_completion',
      name: 'First Completion',
      rule: {
        kind: 'completionCount',
        completionCount: { gte: 1 }
      }
    };

    // Mock sessions with one completed
    const mockSessions = [
      {
        _id: sessionId,
        storyId: storyId,
        progress: { completed: true },
        updatedAt: new Date()
      }
    ];

    // Mock dependencies
    const mockDeps = {
      Achievement: { 
        find: jest.fn().mockReturnValue({
          lean: mockAchievementFind
        })
      },
      Session: { 
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: mockSessionFind
        })
      },
      UserAchievement: { updateOne: mockUserAchievementUpdateOne },
      mongoose: {
        Types: {
          ObjectId: jest.fn((id) => ({ toString: () => id }))
        }
      }
    };

    // First call - should create achievement
    mockAchievementFind.mockResolvedValue([mockAchievement]);
    mockSessionFind.mockResolvedValue(mockSessions);
    mockUserAchievementUpdateOne.mockResolvedValueOnce({
      upsertedCount: 1,
      matchedCount: 0,
      modifiedCount: 0
    });

    const result1 = await evaluateAndUnlock({ userId, storyId, sessionId, deps: mockDeps });

    expect(result1).toEqual({
      created: 1,
      unlocked: ['first_completion']
    });

    // Second call - should be idempotent (no new creation)
    mockUserAchievementUpdateOne.mockResolvedValueOnce({
      upsertedCount: 0,
      matchedCount: 1,
      modifiedCount: 0
    });

    const result2 = await evaluateAndUnlock({ userId, storyId, sessionId, deps: mockDeps });

    expect(result2).toEqual({
      created: 0,
      unlocked: []
    });

    // Verify updateOne was called with correct parameters
    expect(mockUserAchievementUpdateOne).toHaveBeenCalledWith(
      { dedupeKey: `${userId}:${mockAchievement.code}` },
      {
        $setOnInsert: {
          userId: expect.any(Object),
          achievementCode: mockAchievement.code,
          storyId: storyId,
          sessionId: expect.any(Object),
          unlockedAt: expect.any(Date),
          dedupeKey: `${userId}:${mockAchievement.code}`
        }
      },
      { upsert: true }
    );
  });

  test('should handle multiple achievement rules', async () => {
    const userId = 'user123';

    // Mock multiple achievements
    const mockAchievements = [
      {
        code: 'first_completion',
        name: 'First Completion',
        rule: {
          kind: 'completionCount',
          completionCount: { gte: 1 }
        }
      },
      {
        code: 'chapter_5',
        name: 'Chapter 5',
        rule: {
          kind: 'progress',
          progress: { chapterGte: 5 }
        }
      }
    ];

    // Mock sessions that satisfy both rules
    const mockSessions = [
      {
        _id: 'session1',
        storyId: 'story1',
        progress: { completed: true, chapter: 5 },
        updatedAt: new Date()
      }
    ];

    const mockDeps = {
      Achievement: { 
        find: jest.fn().mockReturnValue({
          lean: mockAchievementFind
        })
      },
      Session: { 
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: mockSessionFind
        })
      },
      UserAchievement: { updateOne: mockUserAchievementUpdateOne },
      mongoose: {
        Types: {
          ObjectId: jest.fn((id) => ({ toString: () => id }))
        }
      }
    };

    mockAchievementFind.mockResolvedValue(mockAchievements);
    mockSessionFind.mockResolvedValue(mockSessions);
    
    // Mock both achievements to be created
    mockUserAchievementUpdateOne
      .mockResolvedValueOnce({ upsertedCount: 1, matchedCount: 0, modifiedCount: 0 })
      .mockResolvedValueOnce({ upsertedCount: 1, matchedCount: 0, modifiedCount: 0 });

    const result = await evaluateAndUnlock({ userId, deps: mockDeps });

    expect(result).toEqual({
      created: 2,
      unlocked: ['first_completion', 'chapter_5']
    });
  });

  test('should handle no matching achievements', async () => {
    const userId = 'user123';

    // Mock achievement that requires more completions than user has
    const mockAchievement = {
      code: 'completion_master',
      name: 'Completion Master',
      rule: {
        kind: 'completionCount',
        completionCount: { gte: 10 }
      }
    };

    // Mock sessions with no completions
    const mockSessions = [
      {
        _id: 'session1',
        storyId: 'story1',
        progress: { completed: false, chapter: 1 },
        updatedAt: new Date()
      }
    ];

    const mockDeps = {
      Achievement: { 
        find: jest.fn().mockReturnValue({
          lean: mockAchievementFind
        })
      },
      Session: { 
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: mockSessionFind
        })
      },
      UserAchievement: { updateOne: mockUserAchievementUpdateOne }
    };

    mockAchievementFind.mockResolvedValue([mockAchievement]);
    mockSessionFind.mockResolvedValue(mockSessions);

    const result = await evaluateAndUnlock({ userId, deps: mockDeps });

    expect(result).toEqual({
      created: 0,
      unlocked: []
    });

    // Should not call updateOne since no achievements should unlock
    expect(mockUserAchievementUpdateOne).not.toHaveBeenCalled();
  });

  test('should handle database errors gracefully', async () => {
    const userId = 'user123';

    const mockAchievement = {
      code: 'first_completion',
      name: 'First Completion',
      rule: {
        kind: 'completionCount',
        completionCount: { gte: 1 }
      }
    };

    const mockSessions = [
      {
        _id: 'session1',
        storyId: 'story1',
        progress: { completed: true },
        updatedAt: new Date()
      }
    ];

    const mockDeps = {
      Achievement: { 
        find: jest.fn().mockReturnValue({
          lean: mockAchievementFind
        })
      },
      Session: { 
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: mockSessionFind
        })
      },
      UserAchievement: { updateOne: mockUserAchievementUpdateOne }
    };

    mockAchievementFind.mockResolvedValue([mockAchievement]);
    mockSessionFind.mockResolvedValue(mockSessions);
    
    // Mock database error
    mockUserAchievementUpdateOne.mockRejectedValue(new Error('Database error'));

    // Should not throw
    await expect(evaluateAndUnlock({ userId, deps: mockDeps })).resolves.not.toThrow();

    const result = await evaluateAndUnlock({ userId, deps: mockDeps });
    expect(result).toEqual({
      created: 0,
      unlocked: []
    });
  });
});
