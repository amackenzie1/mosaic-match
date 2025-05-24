/**
 * MosaicMatch Mock Data
 * 
 * Provides mock responses for development without the microservice
 * Only used when process.env.NODE_ENV !== 'production' and no NEXT_PUBLIC_MATCH_MICROSERVICE_URL
 */
import type {
  MatchServiceResponse,
  MatchingStatus,
  MatchPair,
  UserAggregatedTraits
} from '../types';

// Mock user states for testing different user flows
export type MockUserState = 'new' | 'waiting' | 'matched';

// Keep track of the mock user state
let mockUserState: MockUserState = 'new';

/**
 * Set mock user state for testing different scenarios
 * @param {MockUserState} state - The user state to simulate
 */
export function setMockUserState(state: MockUserState): void {
  mockUserState = state;
}

// Mock responses for each endpoint
export const mockResponses = {
  // Get user matching status
  getUserMatchingStatus: (): MatchingStatus => {
    switch (mockUserState) {
      case 'new':
        return {
          isSeekingMatch: false,
          hasNeverOptedIn: true,
          missedCyclesCount: 0
        };
      case 'waiting':
        return {
          isSeekingMatch: true,
          optInTimestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          missedCyclesCount: 0
        };
      case 'matched':
        return {
          isSeekingMatch: false,
          optInTimestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          lastMatchedCycleId: 'mock-cycle-2023-05-16-01',
          currentMatchPartnerId: 'mock-partner-user-id',
          missedCyclesCount: 0
        };
    }
  },

  // Opt in to matching
  optInToMatching: (): MatchServiceResponse => {
    // Simulate successful opt-in
    mockUserState = 'waiting';
    
    return {
      success: true,
      status: 'pending',
      message: 'Successfully opted in to matching. Your profile is being processed.',
      data: {
        matchingStatus: {
          isSeekingMatch: true,
          optInTimestamp: new Date().toISOString(),
          missedCyclesCount: 0
        }
      }
    };
  },

  // Opt out from matching
  optOutFromMatching: (): boolean => {
    // Simulate successful opt-out
    mockUserState = 'new';
    return true;
  },

  // Get current match
  getCurrentMatch: (): MatchPair | null => {
    // Only return a match if in 'matched' state
    if (mockUserState === 'matched') {
      return {
        user1Id: localStorage.getItem('userId') || 'current-user-id',
        user2Id: 'mock-partner-user-id',
        score: 0.89,
        cycleId: 'mock-cycle-2023-05-16-01',
        nakamaChannelId: 'mock-nakama-channel-123',
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };
    }
    
    return null;
  },

  // Get user traits
  getUserTraits: (): UserAggregatedTraits => {
    return {
      globalUserId: localStorage.getItem('userId') || 'current-user-id',
      traits: 'Empathetic, detail-oriented, logical, open-minded, cautious, enjoys deep conversations, shows interest in others\' perspectives, shares personal experiences, prefers clarity in communication, responds promptly.',
      lastUpdated: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
    };
  }
};

// Helper function to simulate API delay
export function simulateApiDelay(minMs = 300, maxMs = 1200): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}