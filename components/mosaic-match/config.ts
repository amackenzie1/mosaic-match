import { MosaicMatchConfig } from './types';

/**
 * MosaicMatch Configuration
 * 
 * Provides client-safe configuration for the MosaicMatch feature.
 * Sensitive data like API keys are NOT exposed to the client.
 */

// Client-safe configuration
// Only public, non-sensitive information should be here
export const mosaicMatchConfig: MosaicMatchConfig = {
  nakama: {
    serverUrl: process.env.NEXT_PUBLIC_NAKAMA_SERVER_URL || 'http://localhost:7350',
    timeout: 5000,
  },
  ui: {
    refreshInterval: 30000, // 30 seconds
    pollInterval: 10000,    // 10 seconds
  }
};

/**
 * Validates the MosaicMatch configuration
 * @returns {boolean} True if the configuration is valid
 */
export function validateMosaicMatchConfig(): boolean {
  // Basic validation for required configuration entries
  return !!mosaicMatchConfig.nakama?.serverUrl;
}

/**
 * Checks if MosaicMatch is properly configured
 * @returns {boolean} True if MosaicMatch is configured
 */
export function isMosaicMatchConfigured(): boolean {
  // In development mode, always return true for easier testing
  // (will fall back to mocks if Nakama is not available)
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  
  // In production, perform actual validation
  return validateMosaicMatchConfig();
}

/**
 * Gets the user ID for MosaicMatch (Cognito sub)
 * @returns {string | null} User ID from localStorage or null if not found
 */
export function getMosaicMatchUserId(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Currently in the app, userId is stored in localStorage by UserDashboard.tsx
  return localStorage.getItem('userId');
}