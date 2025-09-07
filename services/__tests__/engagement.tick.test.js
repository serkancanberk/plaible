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
const mockReengagementRuleFind = jest.fn();
const mockEngagementMessageUpdateOne = jest.fn();
const mockUserFindById = jest.fn();
const mockSessionFindOne = jest.fn();
const mockSaveFind = jest.fn();
const mockStoryFindById = jest.fn();

jest.unstable_mockModule('../../models/ReengagementRule.js', () => ({
  ReengagementRule: {
    find: mockReengagementRuleFind
  }
}));

jest.unstable_mockModule('../../models/EngagementMessage.js', () => ({
  EngagementMessage: {
    updateOne: mockEngagementMessageUpdateOne
  }
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  User: {
    findById: jest.fn().mockReturnValue({
      lean: mockUserFindById
    })
  }
}));

jest.unstable_mockModule('../../models/Session.js', () => ({
  Session: {
    findOne: jest.fn().mockReturnValue({
      lean: mockSessionFindOne,
      sort: jest.fn().mockReturnThis()
    })
  }
}));

jest.unstable_mockModule('../../models/Save.js', () => ({
  Save: {
    find: jest.fn().mockReturnValue({
      lean: mockSaveFind
    })
  }
}));

jest.unstable_mockModule('../../models/Story.js', () => ({
  Story: {
    findById: jest.fn().mockReturnValue({
      lean: mockStoryFindById
    })
  }
}));

// Mock eventLog
jest.unstable_mockModule('../eventLog.js', () => ({
  logEvent: jest.fn().mockResolvedValue(true)
}));

describe('Engagement Tick', () => {
  let buildForUser, upsertMessages;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Import the service after mocking
    const engagementModule = await import('../engagementRules.js');
    buildForUser = engagementModule.buildForUser;
    upsertMessages = engagementModule.upsertMessages;
  });

  test('should create message on first tick and respect cooldown on second tick', async () => {
    const userId = 'user123';
    const ruleId = 'rule123';

    // Mock user with low credits
    const mockUser = {
      _id: userId,
      wallet: { balance: 5 },
      identity: { displayName: 'Test User' }
    };

    // Mock lowCredits rule
    const mockRule = {
      _id: ruleId,
      enabled: true,
      storyId: null,
      trigger: {
        type: 'lowCredits',
        lt: 10
      },
      template: 'Hi {displayName}, you have low credits!',
      cooldownHours: 24
    };

    // Mock no active sessions
    const mockSessions = null;
    const mockSaves = [];

    // Mock dependencies
    const mockDeps = {
      User: { 
        findById: jest.fn().mockReturnValue({
          lean: mockUserFindById
        })
      },
      ReengagementRule: { 
        find: jest.fn().mockReturnValue({
          lean: mockReengagementRuleFind
        })
      },
      Session: { 
        findOne: jest.fn().mockReturnValue({
          lean: mockSessionFindOne,
          sort: jest.fn().mockReturnThis()
        })
      },
      Save: { 
        find: jest.fn().mockReturnValue({
          lean: mockSaveFind
        })
      },
      Story: { 
        findById: jest.fn().mockReturnValue({
          lean: mockStoryFindById
        })
      }
    };

    const mockUpsertDeps = {
      EngagementMessage: { updateOne: mockEngagementMessageUpdateOne }
    };

    // Setup mocks
    mockUserFindById.mockResolvedValue(mockUser);
    mockReengagementRuleFind.mockResolvedValue([mockRule]);
    mockSessionFindOne.mockResolvedValue(mockSessions);
    mockSaveFind.mockResolvedValue(mockSaves);

    // First tick - should create message
    mockEngagementMessageUpdateOne.mockResolvedValueOnce({
      upsertedCount: 1,
      matchedCount: 0,
      modifiedCount: 0
    });

    const messages1 = await buildForUser(userId, mockDeps);
    expect(messages1).toHaveLength(1);
    expect(messages1[0]).toMatchObject({
      ruleId: ruleId,
      type: 'lowCredits',
      userId: userId,
      body: 'Hi Test User, you have low credits!',
      cta: { label: 'Top up', action: 'topup', params: {} }
    });

    const result1 = await upsertMessages(userId, messages1, mockUpsertDeps);
    expect(result1).toEqual({ created: 1 });

    // Second tick within cooldown - should not create new message
    mockEngagementMessageUpdateOne.mockResolvedValueOnce({
      upsertedCount: 0,
      matchedCount: 1,
      modifiedCount: 0
    });

    const messages2 = await buildForUser(userId, mockDeps);
    expect(messages2).toHaveLength(1); // Same message generated

    const result2 = await upsertMessages(userId, messages2, mockUpsertDeps);
    expect(result2).toEqual({ created: 0 }); // No new message created due to dedupe

    // Verify updateOne was called with correct dedupe key
    expect(mockEngagementMessageUpdateOne).toHaveBeenCalledWith(
      { userId, dedupeKey: expect.stringMatching(/^rule123:/) },
      { $setOnInsert: expect.any(Object) },
      { upsert: true }
    );
  });

  test('should handle no matching rules', async () => {
    const userId = 'user123';

    // Mock user with high credits
    const mockUser = {
      _id: userId,
      wallet: { balance: 100 },
      identity: { displayName: 'Test User' }
    };

    // Mock lowCredits rule that shouldn't fire
    const mockRule = {
      _id: 'rule123',
      enabled: true,
      storyId: null,
      trigger: {
        type: 'lowCredits',
        lt: 10
      },
      template: 'Low credits!',
      cooldownHours: 24
    };

    const mockDeps = {
      User: { 
        findById: jest.fn().mockReturnValue({
          lean: mockUserFindById
        })
      },
      ReengagementRule: { 
        find: jest.fn().mockReturnValue({
          lean: mockReengagementRuleFind
        })
      },
      Session: { 
        findOne: jest.fn().mockReturnValue({
          lean: mockSessionFindOne,
          sort: jest.fn().mockReturnThis()
        })
      },
      Save: { 
        find: jest.fn().mockReturnValue({
          lean: mockSaveFind
        })
      },
      Story: { 
        findById: jest.fn().mockReturnValue({
          lean: mockStoryFindById
        })
      }
    };

    mockUserFindById.mockResolvedValue(mockUser);
    mockReengagementRuleFind.mockResolvedValue([mockRule]);
    mockSessionFindOne.mockResolvedValue(null);
    mockSaveFind.mockResolvedValue([]);

    const messages = await buildForUser(userId, mockDeps);
    expect(messages).toHaveLength(0);
  });
});
