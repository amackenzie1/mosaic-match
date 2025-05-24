/**
 * Tests for MosaicMatch hooks
 * 
 * Basic functionality tests for useMosaicMatch hook
 */
import { renderHook, act } from '@testing-library/react';
import { useMosaicMatch } from '../hooks/use-mosaic-match';
import { MockUserState } from '../services/mock-data';

// Mock the API client functions
jest.mock('../services/api-client', () => ({
  canUserParticipateInMatching: jest.fn().mockResolvedValue(true),
  getUserMatchingStatus: jest.fn().mockResolvedValue({
    isSeekingMatch: false,
    missedCyclesCount: 0
  }),
  optInToMatching: jest.fn().mockResolvedValue({
    success: true,
    status: 'pending',
    message: 'Successfully opted in',
    data: {
      matchingStatus: {
        isSeekingMatch: true,
        optInTimestamp: new Date().toISOString(),
        missedCyclesCount: 0
      }
    }
  }),
  optOutFromMatching: jest.fn().mockResolvedValue(true),
  getCurrentMatch: jest.fn().mockResolvedValue(null),
  getUserTraits: jest.fn().mockResolvedValue({
    globalUserId: 'test-user-123',
    traits: 'Sample traits',
    lastUpdated: new Date().toISOString()
  })
}));

// Mock the setMockUserState function
jest.mock('../services/mock-data', () => ({
  setMockUserState: jest.fn(),
  MockUserState: {
    'new': 'new',
    'waiting': 'waiting',
    'matched': 'matched'
  }
}));

describe('useMosaicMatch Hook - Basic Tests', () => {
  // Set up localStorage mock
  let localStorageMock: Record<string, string> = {};
  
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageMock[key] || null,
        setItem: (key: string, value: string) => {
          localStorageMock[key] = value.toString();
        },
        clear: () => {
          localStorageMock = {};
        }
      },
      writable: true
    });
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    localStorageMock = {};
    localStorageMock['userId'] = 'test-user-123';
  });

  test('should start with loading state', async () => {
    const { result } = renderHook(() => useMosaicMatch(false)); // Disable auto-refresh
    
    // Initial state should be loading
    expect(result.current.status).toBe('loading');
    expect(result.current.isLoading).toBe(true);
  });

  test('should transition to eligible state after loading', async () => {
    const { result, rerender } = renderHook(() => useMosaicMatch(false));
    
    // Wait for initial data fetch to complete
    await act(async () => {
      // This simulates waiting for async effects
      await Promise.resolve();
    });
    
    // Re-render to ensure the state update is reflected
    rerender();
    
    // Should be in eligible state (no match, not seeking)
    expect(result.current.status).toBe('eligible');
    expect(result.current.isEligible).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
});