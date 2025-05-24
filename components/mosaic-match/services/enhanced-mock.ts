/**
 * Enhanced Mock System for MosaicMatch
 * 
 * This module provides improved testing capabilities without requiring
 * a Nakama deployment. It allows simulation of different user journeys,
 * error conditions, and network delays.
 * 
 * It extends the basic mock-data.ts functionality with more control
 * over the mock behavior, allowing complex scenarios to be tested.
 */
import type {
  MatchServiceResponse,
  MatchingStatus,
  MatchPair,
  UserAggregatedTraits
} from '../types';
import { MockUserState, mockResponses, setMockUserState } from './mock-data';
import { MosaicMatchError } from './error';

/**
 * Configuration for enhanced mock system
 */
export interface EnhancedMockConfig {
  // Whether to enable enhanced mock mode
  enabled: boolean;
  
  // Simulate network delays
  simulateNetworkDelay: boolean;
  
  // Delay range in milliseconds
  minDelayMs: number;
  maxDelayMs: number;
  
  // Whether to inject random errors
  injectRandomErrors: boolean;
  
  // Error probability (0-1)
  errorProbability: number;
  
  // Error types to simulate
  simulateNetworkErrors: boolean;
  simulateClientErrors: boolean;
  simulateServerErrors: boolean;
  
  // User journey simulation
  simulateUserJourney: boolean;
  
  // Journey progression timing (in seconds)
  journeySteps: {
    // How long to stay in processing state before transitioning to waiting
    processingDuration: number;
    
    // How long to stay in waiting state before auto-matching
    waitingDuration: number;
  };
}

// Default configuration
const defaultConfig: EnhancedMockConfig = {
  enabled: false,
  simulateNetworkDelay: true,
  minDelayMs: 200,
  maxDelayMs: 800,
  injectRandomErrors: false,
  errorProbability: 0.1,
  simulateNetworkErrors: true,
  simulateClientErrors: true,
  simulateServerErrors: true,
  simulateUserJourney: false,
  journeySteps: {
    processingDuration: 10,
    waitingDuration: 30
  }
};

// Current configuration
let currentConfig: EnhancedMockConfig = { ...defaultConfig };

// User journey simulation state
interface JourneyState {
  currentState: MockUserState;
  enteredStateAt: number;
  processingStartedAt: number | null;
  waitingStartedAt: number | null;
  matchedAt: number | null;
}

// Initial journey state
const journeyState: JourneyState = {
  currentState: 'new',
  enteredStateAt: Date.now(),
  processingStartedAt: null,
  waitingStartedAt: null,
  matchedAt: null
};

/**
 * Enable enhanced mock mode with custom configuration
 * @param {Partial<EnhancedMockConfig>} config - Configuration overrides
 */
export function enableEnhancedMockMode(config: Partial<EnhancedMockConfig> = {}): void {
  // Apply configuration overrides
  currentConfig = {
    ...defaultConfig,
    ...config,
    enabled: true
  };
  
  // Reset journey state
  resetJourneyState();
  
  console.info('Enhanced mock mode enabled:', currentConfig);
}

/**
 * Disable enhanced mock mode
 */
export function disableEnhancedMockMode(): void {
  currentConfig.enabled = false;
  console.info('Enhanced mock mode disabled');
}

/**
 * Get current enhanced mock configuration
 */
export function getEnhancedMockConfig(): EnhancedMockConfig {
  return { ...currentConfig };
}

/**
 * Reset journey state to initial values
 */
export function resetJourneyState(): void {
  journeyState.currentState = 'new';
  journeyState.enteredStateAt = Date.now();
  journeyState.processingStartedAt = null;
  journeyState.waitingStartedAt = null;
  journeyState.matchedAt = null;
  
  // Set mock state to new
  setMockUserState('new');
}

/**
 * Update journey state based on time progression
 * This automates transitions between states based on configured durations
 */
function updateJourneyState(): void {
  const now = Date.now();
  
  // Skip if user journey simulation is disabled
  if (!currentConfig.simulateUserJourney) {
    return;
  }
  
  // Check for state transitions based on elapsed time
  switch (journeyState.currentState) {
    case 'new':
      // New state doesn't auto-transition, requires explicit opt-in
      break;
      
    case 'waiting':
      // Check if we've been in waiting state long enough to match
      if (journeyState.waitingStartedAt) {
        const waitingDurationSec = (now - journeyState.waitingStartedAt) / 1000;
        
        if (waitingDurationSec >= currentConfig.journeySteps.waitingDuration) {
          // Transition to matched state
          journeyState.currentState = 'matched';
          journeyState.enteredStateAt = now;
          journeyState.matchedAt = now;
          
          // Update mock state
          setMockUserState('matched');
        }
      }
      break;
      
    default:
      // No automatic transitions for other states
      break;
  }
}

/**
 * Simulate network delay based on configuration
 */
async function simulateDelay(): Promise<void> {
  if (!currentConfig.simulateNetworkDelay) {
    return;
  }
  
  const delayRange = currentConfig.maxDelayMs - currentConfig.minDelayMs;
  const delay = Math.floor(Math.random() * delayRange) + currentConfig.minDelayMs;
  
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Potentially inject a random error based on configuration
 */
function maybeInjectError(): void {
  if (!currentConfig.injectRandomErrors) {
    return;
  }
  
  // Check if we should inject an error
  if (Math.random() < currentConfig.errorProbability) {
    // Decide which type of error to inject
    const errorTypes = [];
    
    if (currentConfig.simulateNetworkErrors) errorTypes.push('network');
    if (currentConfig.simulateClientErrors) errorTypes.push('client');
    if (currentConfig.simulateServerErrors) errorTypes.push('server');
    
    if (errorTypes.length === 0) {
      return; // No error types enabled
    }
    
    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    
    switch (errorType) {
      case 'network':
        throw new TypeError('Network error: Failed to fetch');
        
      case 'client':
        throw new MosaicMatchError('Client error: Bad request', 400);
        
      case 'server':
        throw new MosaicMatchError('Server error: Internal server error', 500);
    }
  }
}

/**
 * Get user matching status with enhanced mock features
 */
export async function getMockUserMatchingStatus(): Promise<MatchingStatus | null> {
  if (!currentConfig.enabled) {
    return mockResponses.getUserMatchingStatus();
  }
  
  await simulateDelay();
  maybeInjectError();
  updateJourneyState();
  
  const status = mockResponses.getUserMatchingStatus();
  
  // For processing state, we need to check if we should auto-transition to waiting
  if (
    journeyState.currentState === 'waiting' &&
    journeyState.processingStartedAt &&
    currentConfig.simulateUserJourney
  ) {
    const processingDurationSec = (Date.now() - journeyState.processingStartedAt) / 1000;
    
    if (processingDurationSec < currentConfig.journeySteps.processingDuration) {
      // Still in processing state - modify status to show processing
      const processingStatus: MatchingStatus = {
        isSeekingMatch: true,
        optInTimestamp: new Date().toISOString(),
        missedCyclesCount: 0
      };
      
      return processingStatus;
    }
  }
  
  return status;
}

/**
 * Opt in to matching with enhanced mock features
 */
export async function mockOptInToMatching(): Promise<MatchServiceResponse | null> {
  if (!currentConfig.enabled) {
    return mockResponses.optInToMatching();
  }
  
  await simulateDelay();
  maybeInjectError();
  
  // Update journey state
  journeyState.currentState = 'waiting';
  journeyState.enteredStateAt = Date.now();
  journeyState.processingStartedAt = Date.now();
  journeyState.waitingStartedAt = Date.now();
  
  return mockResponses.optInToMatching();
}

/**
 * Opt out from matching with enhanced mock features
 */
export async function mockOptOutFromMatching(): Promise<boolean> {
  if (!currentConfig.enabled) {
    return mockResponses.optOutFromMatching();
  }
  
  await simulateDelay();
  maybeInjectError();
  
  // Update journey state
  resetJourneyState();
  
  return mockResponses.optOutFromMatching();
}

/**
 * Get current match with enhanced mock features
 */
export async function mockGetCurrentMatch(): Promise<MatchPair | null> {
  if (!currentConfig.enabled) {
    return mockResponses.getCurrentMatch();
  }
  
  await simulateDelay();
  maybeInjectError();
  updateJourneyState();
  
  return mockResponses.getCurrentMatch();
}

/**
 * Get user traits with enhanced mock features
 */
export async function mockGetUserTraits(): Promise<UserAggregatedTraits | null> {
  if (!currentConfig.enabled) {
    return mockResponses.getUserTraits();
  }
  
  await simulateDelay();
  maybeInjectError();
  
  return mockResponses.getUserTraits();
}

/**
 * Force a specific user journey state for testing
 * @param {MockUserState} state - The state to force
 * @param {object} options - Additional options for the state
 */
export function forceUserJourneyState(
  state: MockUserState, 
  options: {
    timeInState?: number;  // How long to simulate being in this state (in seconds)
    matchScore?: number;   // For matched state, the match score (0-1)
  } = {}
): void {
  const now = Date.now();
  
  // Set the state
  journeyState.currentState = state;
  
  // Reset other timestamp fields
  journeyState.processingStartedAt = null;
  journeyState.waitingStartedAt = null;
  journeyState.matchedAt = null;
  
  // Calculate entry time based on options.timeInState
  const timeInStateMs = options.timeInState ? options.timeInState * 1000 : 0;
  journeyState.enteredStateAt = now - timeInStateMs;
  
  // Set state-specific timestamps
  switch (state) {
    case 'waiting':
      journeyState.processingStartedAt = journeyState.enteredStateAt - 5000; // 5 seconds before
      journeyState.waitingStartedAt = journeyState.enteredStateAt;
      break;
      
    case 'matched':
      journeyState.processingStartedAt = journeyState.enteredStateAt - 60000; // 1 minute before match
      journeyState.waitingStartedAt = journeyState.enteredStateAt - 55000; // 55 seconds before match
      journeyState.matchedAt = journeyState.enteredStateAt;
      break;
  }
  
  // Update mock state
  setMockUserState(state);
}

/**
 * Helper function for testing to inject an error on next call
 */
let injectErrorOnNextCall: Error | null = null;

/**
 * Inject a specific error on the next API call
 * @param error The error to inject
 */
export function injectErrorOnNext(error: Error): void {
  injectErrorOnNextCall = error;
}

/**
 * Check and consume the injected error if present
 */
function checkForInjectedError(): void {
  if (injectErrorOnNextCall) {
    const error = injectErrorOnNextCall;
    injectErrorOnNextCall = null;
    throw error;
  }
}