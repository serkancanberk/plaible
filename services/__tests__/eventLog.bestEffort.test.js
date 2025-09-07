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

// Mock the Event model
const mockEventSave = jest.fn();
const mockEventCreate = jest.fn();

jest.unstable_mockModule('../../models/Event.js', () => ({
  Event: mockEventCreate
}));

describe('EventLog Best Effort', () => {
  let logEvent;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create mock event instance
    mockEventSave.mockResolvedValue({});
    mockEventCreate.mockReturnValue({
      save: mockEventSave
    });

    // Import the service after mocking
    const eventLogModule = await import('../eventLog.js');
    logEvent = eventLogModule.logEvent;
  });

  test('should not throw when Event.create throws', async () => {
    // Mock Event constructor to throw
    mockEventCreate.mockImplementation(() => {
      throw new Error('boom');
    });

    // Should not throw
    await expect(logEvent({
      type: 'test.event',
      userId: 'user123',
      meta: { test: 'data' }
    })).resolves.not.toThrow();

    // Should return false (failed to log)
    const result = await logEvent({
      type: 'test.event',
      userId: 'user123',
      meta: { test: 'data' }
    });
    expect(result).toBe(false);
  });

  test('should not throw when Event.save throws', async () => {
    // Mock save to throw
    mockEventSave.mockRejectedValue(new Error('Save failed'));

    // Should not throw
    await expect(logEvent({
      type: 'test.event',
      userId: 'user123',
      meta: { test: 'data' }
    })).resolves.not.toThrow();

    // Should return false (failed to log)
    const result = await logEvent({
      type: 'test.event',
      userId: 'user123',
      meta: { test: 'data' }
    });
    expect(result).toBe(false);
  });

  test('should call Event with correct parameters when successful', async () => {
    // Mock successful save
    mockEventSave.mockResolvedValue({ _id: 'event123' });

    const result = await logEvent({
      type: 'test.event',
      userId: 'user123',
      meta: { test: 'data' },
      level: 'warn'
    });

    // Should return true (successful)
    expect(result).toBe(true);

    // Should call Event constructor with correct parameters
    expect(mockEventCreate).toHaveBeenCalledWith({
      type: 'test.event',
      userId: 'user123',
      meta: { test: 'data' },
      level: 'warn',
      createdAt: expect.any(Date)
    });

    // Should call save
    expect(mockEventSave).toHaveBeenCalled();
  });

  test('should handle missing required parameters', async () => {
    // Test with missing type
    const result1 = await logEvent({
      userId: 'user123',
      meta: { test: 'data' }
    });
    expect(result1).toBe(false);

    // Test with missing userId
    const result2 = await logEvent({
      type: 'test.event',
      meta: { test: 'data' }
    });
    expect(result2).toBe(false);

    // Should not call Event constructor
    expect(mockEventCreate).not.toHaveBeenCalled();
  });

  test('should handle invalid level parameter', async () => {
    mockEventSave.mockResolvedValue({ _id: 'event123' });

    const result = await logEvent({
      type: 'test.event',
      userId: 'user123',
      level: 'invalid_level'
    });

    expect(result).toBe(true);

    // Should default to 'info' level
    expect(mockEventCreate).toHaveBeenCalledWith({
      type: 'test.event',
      userId: 'user123',
      meta: {},
      level: 'info',
      createdAt: expect.any(Date)
    });
  });
});
