/**
 * MosaicMatch Authentication Utilities
 * 
 * NOTE: Client-side HMAC authentication has been removed.
 * Authentication between Nakama RPCs and the microservice happens server-side.
 * The client only needs to authenticate with Nakama using Cognito tokens.
 */

import { getNakamaSession } from './nakama-client';

/**
 * Check if the user is authenticated with Nakama
 * @returns {boolean} True if the user has an active Nakama session
 */
export function isNakamaAuthenticated(): boolean {
  const session = getNakamaSession();
  
  if (!session) {
    return false;
  }
  
  // Check if session is expired
  return !session.isexpired(new Date());
}

/**
 * Get the current user ID from Nakama session
 * @returns {string | null} User ID or null if not authenticated
 */
export function getNakamaUserId(): string | null {
  const session = getNakamaSession();
  
  if (!session) {
    return null;
  }
  
  return session.user_id || null;
}

/**
 * Get the Nakama session token
 * @returns {string | null} Session token or null if not authenticated
 */
export function getNakamaSessionToken(): string | null {
  const session = getNakamaSession();
  
  if (!session) {
    return null;
  }
  
  return session.token || null;
}