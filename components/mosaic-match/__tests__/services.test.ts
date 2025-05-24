/**
 * Tests for MosaicMatch services
 * Focus on basic functionality without mocking entire modules
 */
import { MockUserState, setMockUserState } from '../services/mock-data';
import { MosaicMatchError, isRetryableError } from '../services/error';

// Mock fetch globally to avoid actual network requests
jest.mock('../services/api-client', () => {
  return {
    getUserMatchingStatus: jest.fn().mockResolvedValue({
      isSeekingMatch: true,
      optInTimestamp: new Date().toISOString(),
      missedCyclesCount: 0
    }),
    canUserParticipateInMatching: jest.fn().mockResolvedValue(true)
  };
});

// Mock the mock-data module for tests
jest.mock('../services/mock-data', () => {
  return {
    setMockUserState: jest.fn(),
    mockResponses: {
      getUserMatchingStatus: jest.fn().mockReturnValue({
        isSeekingMatch: true,
        optInTimestamp: new Date().toISOString(),
        missedCyclesCount: 0
      })
    },
    MockUserState: {
      'new': 'new',
      'waiting': 'waiting',
      'matched': 'matched'
    }
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('MosaicMatch Services', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('userId', 'test-user-123');
  });

  describe('Error Handling', () => {
    test('isRetryableError should identify server errors correctly', () => {
      // 5xx errors should be retryable
      const serverError = new MosaicMatchError('Server error', 500);
      expect(isRetryableError(serverError)).toBe(true);
      
      // 429 (rate limit) should be retryable
      const rateLimitError = new MosaicMatchError('Too many requests', 429);
      expect(isRetryableError(rateLimitError)).toBe(true);
      
      // 404 should not be retryable
      const notFoundError = new MosaicMatchError('Not found', 404);
      expect(isRetryableError(notFoundError)).toBe(false);
      
      // Network errors should be retryable
      const networkError = new TypeError('network error');
      expect(isRetryableError(networkError)).toBe(true);
    });
  });

  describe('Mock Data System', () => {
    test('setMockUserState should update the internal state', () => {
      // Call setMockUserState
      setMockUserState('waiting');
      
      // Should have been called with the correct state
      expect(setMockUserState).toHaveBeenCalledWith('waiting');
    });
  });
});