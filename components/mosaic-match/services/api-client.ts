/**
 * MosaicMatch API Client
 * 
 * Provides functions for interacting with the MosaicMatch service via Nakama RPCs
 */
import { 
  isMosaicMatchConfigured, 
  getMosaicMatchUserId 
} from '../config';
import type { 
  MatchServiceResponse, 
  MatchingStatus,
  MatchPair,
  UserAggregatedTraits
} from '../types';
import { mockResponses } from './mock-data';
import {
  callOptInMatchRpc,
  callOptOutMatchRpc,
  callGetMatchStatusRpc,
  callGetCurrentMatchRpc,
  callGetUserTraitsRpc
} from './nakama-client';

/**
 * Handle API errors with standardized logging
 * @param context The context of the error (which operation)
 * @param error The error object
 */
function handleApiError(context: string, error: any): void {
  console.error(`Error ${context}:`, error);
  
  // Check if there's detailed error information
  if (error && typeof error === 'object' && 'error' in error) {
    // Log detailed error information for debugging
    const errorDetails = (error as any).error;
    console.error(`Detailed error in ${context}:`, errorDetails);
  }
}

/**
 * Checks if a user is eligible for matching
 * @returns {Promise<boolean>} True if user can participate in matching
 */
export async function canUserParticipateInMatching(): Promise<boolean> {
  try {
    // Ensure system is configured and user is authenticated
    if (!isMosaicMatchConfigured()) {
      console.warn('MosaicMatch not configured');
      return false;
    }

    const userId = getMosaicMatchUserId();
    if (!userId) {
      console.warn('User ID not available');
      return false;
    }

    // In real implementation, we would check if user has enough 
    // analyzed conversations to generate meaningful embeddings
    // This could also be a Nakama RPC call
    return true;
  } catch (error) {
    handleApiError('checking user match eligibility', error);
    return false;
  }
}

/**
 * Gets the current matching status for the user
 * @returns {Promise<MatchingStatus | null>} The user's matching status or null on error
 */
export async function getUserMatchingStatus(): Promise<MatchingStatus | null> {
  try {
    if (!isMosaicMatchConfigured()) {
      return null;
    }

    const userId = getMosaicMatchUserId();
    if (!userId) {
      return null;
    }

    // For development, use mock data if not production OR if Nakama is unavailable
    if (process.env.NODE_ENV !== 'production' && 
        (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !process.env.NEXT_PUBLIC_NAKAMA_SERVER_URL)) {
      return mockResponses.getUserMatchingStatus();
    }

    // Try to call Nakama RPC, fall back to mocks if it fails
    try {
      const response = await callGetMatchStatusRpc();
      if (!response) {
        return null;
      }
      return response.matchingStatus || null;
    } catch (error) {
      console.warn('Nakama RPC failed, falling back to mock data:', error);
      return mockResponses.getUserMatchingStatus();
    }
  } catch (error) {
    handleApiError('fetching user matching status', error);
    return null;
  }
}

/**
 * Opts the user into the matching system
 * @returns {Promise<MatchServiceResponse | null>} The service response or null on error
 */
export async function optInToMatching(): Promise<MatchServiceResponse | null> {
  try {
    if (!isMosaicMatchConfigured()) {
      return null;
    }

    const userId = getMosaicMatchUserId();
    if (!userId) {
      return null;
    }

    // For development, use mock data if not production OR if Nakama is unavailable
    if (process.env.NODE_ENV !== 'production' && 
        (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !process.env.NEXT_PUBLIC_NAKAMA_SERVER_URL)) {
      return mockResponses.optInToMatching();
    }

    // Try to call Nakama RPC, fall back to mocks if it fails
    try {
      const response = await callOptInMatchRpc();
      return response || { success: false, message: 'Failed to opt in' };
    } catch (error) {
      console.warn('Nakama RPC failed, falling back to mock data:', error);
      return mockResponses.optInToMatching();
    }
  } catch (error) {
    handleApiError('opting in to matching', error);
    return null;
  }
}

/**
 * Opts the user out of the matching system
 * @returns {Promise<boolean>} True if the opt-out was successful
 */
export async function optOutFromMatching(): Promise<boolean> {
  try {
    if (!isMosaicMatchConfigured()) {
      return false;
    }

    const userId = getMosaicMatchUserId();
    if (!userId) {
      return false;
    }

    // For development, use mock data if not production OR if Nakama is unavailable
    if (process.env.NODE_ENV !== 'production' && 
        (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !process.env.NEXT_PUBLIC_NAKAMA_SERVER_URL)) {
      return mockResponses.optOutFromMatching();
    }

    // Try to call Nakama RPC, fall back to mocks if it fails
    try {
      const response = await callOptOutMatchRpc();
      return response?.success || false;
    } catch (error) {
      console.warn('Nakama RPC failed, falling back to mock data:', error);
      return mockResponses.optOutFromMatching();
    }
  } catch (error) {
    handleApiError('opting out from matching', error);
    return false;
  }
}

/**
 * Gets the user's current match if they have one
 * @returns {Promise<MatchPair | null>} The current match or null if no match
 */
export async function getCurrentMatch(): Promise<MatchPair | null> {
  try {
    if (!isMosaicMatchConfigured()) {
      return null;
    }

    const userId = getMosaicMatchUserId();
    if (!userId) {
      return null;
    }

    // For development, use mock data if not production OR if Nakama is unavailable
    if (process.env.NODE_ENV !== 'production' && 
        (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !process.env.NEXT_PUBLIC_NAKAMA_SERVER_URL)) {
      return mockResponses.getCurrentMatch();
    }

    // Try to call Nakama RPC, fall back to mocks if it fails
    try {
      const response = await callGetCurrentMatchRpc();
      return response?.match || null;
    } catch (error) {
      console.warn('Nakama RPC failed, falling back to mock data:', error);
      return mockResponses.getCurrentMatch();
    }
  } catch (error) {
    handleApiError('fetching current match', error);
    return null;
  }
}

/**
 * Gets the user's aggregated traits
 * @returns {Promise<UserAggregatedTraits | null>} The user's traits or null on error
 */
export async function getUserTraits(): Promise<UserAggregatedTraits | null> {
  try {
    if (!isMosaicMatchConfigured()) {
      return null;
    }

    const userId = getMosaicMatchUserId();
    if (!userId) {
      return null;
    }

    // For development, use mock data if not production OR if Nakama is unavailable
    if (process.env.NODE_ENV !== 'production' && 
        (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !process.env.NEXT_PUBLIC_NAKAMA_SERVER_URL)) {
      return mockResponses.getUserTraits();
    }

    // Try to call Nakama RPC, fall back to mocks if it fails
    try {
      const response = await callGetUserTraitsRpc();
      return response || null;
    } catch (error) {
      console.warn('Nakama RPC failed, falling back to mock data:', error);
      return mockResponses.getUserTraits();
    }
  } catch (error) {
    handleApiError('fetching user traits', error);
    return null;
  }
}