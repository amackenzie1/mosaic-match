/**
 * Advanced Hook Tests for MosaicMatch
 * 
 * These tests focus on the more complex behaviors of the useMosaicMatch hook:
 * - State transitions
 * - Time calculations
 * - Auto-refresh behavior
 * - Error handling
 */
import { renderHook, act } from '@testing-library/react';
import { useMosaicMatch } from '../hooks/use-mosaic-match';
import * as apiClient from '../services/api-client';
import { MockUserState, setMockUserState } from '../services/mock-data';

// Mock the API client functions
jest.mock('../services/api-client', () => ({
  canUserParticipateInMatching: jest.fn(),
  getUserMatchingStatus: jest.fn(),
  optInToMatching: jest.fn(),
  optOutFromMatching: jest.fn(),
  getCurrentMatch: jest.fn(),
  getUserTraits: jest.fn()
}));

// Mock the mock-data module for test state manipulation
jest.mock('../services/mock-data', () => ({
  setMockUserState: jest.fn(),
  MockUserState: {
    'new': 'new',
    'waiting': 'waiting',
    'matched': 'matched'
  }
}));

describe('useMosaicMatch Advanced Features', () => {
  // Set up localStorage mock
  let localStorageMock: Record<string, string> = {};
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
    jest.useFakeTimers();
    
    // Mock localStorage
    localStorageMock = {};
    localStorageMock['userId'] = 'test-user-123';
    
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
    
    // Set up default mock implementations
    (apiClient.canUserParticipateInMatching as jest.Mock).mockResolvedValue(true);
    (apiClient.getUserMatchingStatus as jest.Mock).mockResolvedValue({
      isSeekingMatch: false,
      missedCyclesCount: 0
    });
    (apiClient.getCurrentMatch as jest.Mock).mockResolvedValue(null);
    (apiClient.getUserTraits as jest.Mock).mockResolvedValue({
      globalUserId: 'test-user-123',
      traits: 'Sample traits',
      lastUpdated: new Date().toISOString()
    });
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  test('should auto-refresh status at different intervals based on user state', async () => {
    // First render with auto-refresh enabled
    const { result } = renderHook(() => useMosaicMatch(true));
    
    // Wait for initial data fetch
    await act(async () => {
      await Promise.resolve(); // Let pending promises resolve
    });
    
    // Initial state should be eligible
    expect(result.current.status).toBe('eligible');
    
    // Reset mock call counts
    jest.clearAllMocks();
    
    // Advance time by 2 minutes (120000ms)
    await act(async () => {
      jest.advanceTimersByTime(120000);
    });
    
    // Should have refreshed (eligible uses longer interval)
    expect(apiClient.getUserMatchingStatus).toHaveBeenCalled();
    jest.clearAllMocks();
    
    // Now simulate waiting state
    (apiClient.getUserMatchingStatus as jest.Mock).mockResolvedValue({
      isSeekingMatch: true,
      optInTimestamp: new Date().toISOString(),
      missedCyclesCount: 0
    });
    
    // Force refresh to update state
    await act(async () => {
      await result.current.refreshStatus();
    });
    
    // Should now be in waiting state
    expect(result.current.status).toBe('waiting');
    jest.clearAllMocks();
    
    // Advance time by 30 seconds
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });
    
    // Should have refreshed (waiting uses shorter interval)
    expect(apiClient.getUserMatchingStatus).toHaveBeenCalled();
  });

  test('should handle errors during status refresh gracefully', async () => {
    // Mock API error on first call, then success on second
    (apiClient.getUserMatchingStatus as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        isSeekingMatch: false,
        missedCyclesCount: 0
      });
    
    // Render hook
    const { result } = renderHook(() => useMosaicMatch(false));
    
    // Wait for initial data fetch (which will fail)
    await act(async () => {
      await Promise.resolve();
    });
    
    // Should remain in loading state due to error
    expect(result.current.status).toBe('loading');
    
    // Manually refresh (should succeed this time)
    await act(async () => {
      await result.current.refreshStatus();
    });
    
    // Should now be in eligible state
    expect(result.current.status).toBe('eligible');
  });

  test('should handle not-eligible state correctly', async () => {
    // User cannot participate in matching
    (apiClient.canUserParticipateInMatching as jest.Mock).mockResolvedValue(false);
    
    // Render hook
    const { result } = renderHook(() => useMosaicMatch(false));
    
    // Wait for initial data fetch
    await act(async () => {
      await Promise.resolve();
    });
    
    // Should be in not-eligible state
    expect(result.current.status).toBe('not-eligible');
    
    // Try to opt in (should fail)
    let success: boolean;
    await act(async () => {
      success = await result.current.optIn();
    });
    
    // Should not have called optInToMatching
    expect(apiClient.optInToMatching).not.toHaveBeenCalled();
    expect(success).toBe(false);
  });

  test('should correctly track state transitions through the full lifecycle', async () => {
    // Start with eligible user
    (apiClient.canUserParticipateInMatching as jest.Mock).mockResolvedValue(true);
    (apiClient.getUserMatchingStatus as jest.Mock).mockResolvedValue({
      isSeekingMatch: false,
      missedCyclesCount: 0
    });
    
    // Render hook
    const { result } = renderHook(() => useMosaicMatch(false));
    
    // Wait for initial data fetch
    await act(async () => {
      await Promise.resolve();
    });
    
    // Should be in eligible state
    expect(result.current.status).toBe('eligible');
    
    // Mock successful opt-in
    (apiClient.optInToMatching as jest.Mock).mockResolvedValue({
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
    });
    
    // Opt in
    await act(async () => {
      await result.current.optIn();
    });
    
    // Update getUserMatchingStatus to return waiting state for next call
    (apiClient.getUserMatchingStatus as jest.Mock).mockResolvedValue({
      isSeekingMatch: true,
      optInTimestamp: new Date().toISOString(),
      missedCyclesCount: 0
    });
    
    // Refresh to pick up new state
    await act(async () => {
      await result.current.refreshStatus();
    });
    
    // Should be in processing state initially (just opted in)
    expect(result.current.status).toBe('processing');
    
    // Simulate time passage (more than 60 seconds)
    const oneMinuteAgo = new Date(Date.now() - 61000).toISOString();
    (apiClient.getUserMatchingStatus as jest.Mock).mockResolvedValue({
      isSeekingMatch: true,
      optInTimestamp: oneMinuteAgo,
      missedCyclesCount: 0
    });
    
    // Refresh to get updated state
    await act(async () => {
      await result.current.refreshStatus();
    });
    
    // Should now be in waiting state
    expect(result.current.status).toBe('waiting');
    
    // Simulate match found
    (apiClient.getUserMatchingStatus as jest.Mock).mockResolvedValue({
      isSeekingMatch: false,
      optInTimestamp: oneMinuteAgo,
      lastMatchedCycleId: 'test-cycle-id',
      currentMatchPartnerId: 'partner-user-id',
      missedCyclesCount: 0
    });
    
    (apiClient.getCurrentMatch as jest.Mock).mockResolvedValue({
      user1Id: 'test-user-123',
      user2Id: 'partner-user-id',
      score: 0.92,
      cycleId: 'test-cycle-id',
      nakamaChannelId: 'test-channel-id',
      createdAt: new Date().toISOString()
    });
    
    // Refresh to get match
    await act(async () => {
      await result.current.refreshStatus();
    });
    
    // Should be in matched state
    expect(result.current.status).toBe('matched');
    expect(result.current.currentMatch).not.toBeNull();
    expect(result.current.currentMatch?.score).toBe(0.92);
    
    // Opt out
    (apiClient.optOutFromMatching as jest.Mock).mockResolvedValue(true);
    
    await act(async () => {
      await result.current.optOut();
    });
    
    // Update data for next refresh
    (apiClient.getUserMatchingStatus as jest.Mock).mockResolvedValue({
      isSeekingMatch: false,
      missedCyclesCount: 0
    });
    (apiClient.getCurrentMatch as jest.Mock).mockResolvedValue(null);
    
    // Refresh to get updated state
    await act(async () => {
      await result.current.refreshStatus();
    });
    
    // Should be back to eligible state
    expect(result.current.status).toBe('eligible');
    expect(result.current.currentMatch).toBeNull();
  });

  test('should correctly calculate wait time based on opt-in timestamp', async () => {
    // Test different wait time scenarios
    const scenarios = [
      // 30 seconds ago
      { timestamp: new Date(Date.now() - 30 * 1000).toISOString(), expected: 0 },
      // 2 minutes ago
      { timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), expected: 2 },
      // 65 minutes ago
      { timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(), expected: 65 },
      // 3 hours ago
      { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), expected: 180 }
    ];
    
    for (const scenario of scenarios) {
      // Mock waiting state with timestamp
      (apiClient.getUserMatchingStatus as jest.Mock).mockResolvedValue({
        isSeekingMatch: true,
        optInTimestamp: scenario.timestamp,
        missedCyclesCount: 0
      });
      
      // Render hook
      const { result } = renderHook(() => useMosaicMatch(false));
      
      // Wait for initial data fetch
      await act(async () => {
        await Promise.resolve();
      });
      
      // Should calculate correct wait time (with small margin for test execution time)
      expect(result.current.waitTimeMinutes).toBeGreaterThanOrEqual(scenario.expected);
      expect(result.current.waitTimeMinutes).toBeLessThanOrEqual(scenario.expected + 1);
    }
  });

  test('should use test state setter in development mode', async () => {
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Set to development
    process.env.NODE_ENV = 'development';
    
    // Render hook
    const { result } = renderHook(() => useMosaicMatch(false));
    
    // Wait for initial load
    await act(async () => {
      await Promise.resolve();
    });
    
    // Use test state setter
    await act(async () => {
      result.current.setTestState('waiting');
    });
    
    // Should have called setMockUserState
    expect(setMockUserState).toHaveBeenCalledWith('waiting');
    
    // Should have caused refreshStatus to be called
    expect(apiClient.getUserMatchingStatus).toHaveBeenCalledTimes(2); // Initial + refresh
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });
});