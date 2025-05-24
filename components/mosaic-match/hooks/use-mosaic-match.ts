/**
 * MosaicMatch Hook - Client-side hook for managing matching state
 * 
 * Provides a React hook for accessing and managing MosaicMatch functionality
 */
import { 
  getUserMatchingStatus, 
  optInToMatching, 
  optOutFromMatching,
  getCurrentMatch,
  getUserTraits,
  canUserParticipateInMatching,
  setMockUserState,
  type MockUserState
} from '../services';
import { MatchingStatus, MatchPair, UserAggregatedTraits } from '../types';
import { useCallback, useEffect, useState, useMemo } from 'react';

// Status of the matching process from a UI perspective
export type MatchingUIStatus = 
  | 'loading'         // Initial loading state
  | 'not-eligible'    // User cannot participate (not enough data)
  | 'eligible'        // User can participate but hasn't opted in
  | 'processing'      // User has opted in and system is processing
  | 'waiting'         // User is waiting for a match
  | 'matched';        // User has been matched

export interface UseMosaicMatchResult {
  // Current UI status of the matching process
  status: MatchingUIStatus;
  
  // Raw data
  matchingStatus: MatchingStatus | null;
  currentMatch: MatchPair | null;
  userTraits: UserAggregatedTraits | null;
  
  // Derived data
  isLoading: boolean;
  isEligible: boolean;
  isProcessing: boolean;
  isWaiting: boolean;
  isMatched: boolean;
  waitTimeMinutes: number;
  
  // Actions
  optIn: () => Promise<boolean>;
  optOut: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  
  // For development/testing
  setTestState: (state: MockUserState) => void;
}

/**
 * React hook for managing MosaicMatch functionality
 * @param {boolean} autoRefresh - Whether to auto-refresh status periodically
 * @returns {UseMosaicMatchResult} MosaicMatch state and functions
 */
export function useMosaicMatch(autoRefresh = true): UseMosaicMatchResult {
  // State
  const [status, setStatus] = useState<MatchingUIStatus>('loading');
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus | null>(null);
  const [currentMatch, setCurrentMatch] = useState<MatchPair | null>(null);
  const [userTraits, setUserTraits] = useState<UserAggregatedTraits | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  
  // Derived data
  const isLoading = status === 'loading';
  const isEligible = status === 'eligible';
  const isProcessing = status === 'processing';
  const isWaiting = status === 'waiting';
  const isMatched = status === 'matched';
  
  // Calculate wait time in minutes
  const waitTimeMinutes = useMemo(() => {
    if (!matchingStatus?.optInTimestamp) return 0;
    
    const optInTime = new Date(matchingStatus.optInTimestamp).getTime();
    const now = Date.now();
    return Math.floor((now - optInTime) / (1000 * 60));
  }, [matchingStatus?.optInTimestamp]);
  
  // Refresh all data
  const refreshStatus = useCallback(async () => {
    try {
      // Reset to loading if it's been more than 30 seconds since last refresh
      if (Date.now() - lastRefresh > 30000) {
        setStatus('loading');
      }
      
      // Check eligibility first
      const canParticipate = await canUserParticipateInMatching();
      if (!canParticipate) {
        setStatus('not-eligible');
        return;
      }
      
      // Get all data concurrently
      const [matchStatus, match, traits] = await Promise.all([
        getUserMatchingStatus(),
        getCurrentMatch(),
        getUserTraits()
      ]);
      
      // Update state
      setMatchingStatus(matchStatus);
      setCurrentMatch(match);
      setUserTraits(traits);
      
      // Determine UI status based on data
      if (match) {
        setStatus('matched');
      } else if (matchStatus?.isSeekingMatch) {
        // If user just opted in and we're still processing
        if (matchStatus.optInTimestamp && 
            new Date(matchStatus.optInTimestamp).getTime() > Date.now() - 60000) {
          setStatus('processing');
        } else {
          setStatus('waiting');
        }
      } else {
        setStatus('eligible');
      }
      
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Error refreshing match status:', error);
    }
  }, [lastRefresh]);
  
  // For development/testing: Set mock state
  const setTestState = useCallback((state: MockUserState) => {
    if (process.env.NODE_ENV !== 'production') {
      setMockUserState(state);
      refreshStatus();
    }
  }, [refreshStatus]);
  
  // Opt in to matching
  const optIn = useCallback(async (): Promise<boolean> => {
    try {
      const response = await optInToMatching();
      if (response?.success) {
        setStatus('processing');
        refreshStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error opting in to matching:', error);
      return false;
    }
  }, [refreshStatus]);
  
  // Opt out from matching
  const optOut = useCallback(async (): Promise<boolean> => {
    try {
      const success = await optOutFromMatching();
      if (success) {
        refreshStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error opting out from matching:', error);
      return false;
    }
  }, [refreshStatus]);
  
  // Initial data fetch and auto-refresh
  useEffect(() => {
    refreshStatus();
    
    // Set up auto-refresh if enabled
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        // Auto-refresh every 30 seconds if waiting, every 2 minutes otherwise
        const refreshInterval = isWaiting ? 30000 : 120000;
        if (Date.now() - lastRefresh >= refreshInterval) {
          refreshStatus();
        }
      }, 10000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshStatus, autoRefresh, lastRefresh, isWaiting]);
  
  return {
    status,
    matchingStatus,
    currentMatch,
    userTraits,
    isLoading,
    isEligible,
    isProcessing,
    isWaiting,
    isMatched,
    waitTimeMinutes,
    optIn,
    optOut,
    refreshStatus,
    setTestState
  };
}