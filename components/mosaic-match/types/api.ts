/**
 * API types for MosaicMatch feature
 */

import { MatchingStatus } from './matching';

// User matching response from microservice
export interface MatchServiceResponse {
  success: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message: string;
  data?: {
    matchingStatus?: MatchingStatus;
  };
}

// Error response
export interface ErrorResponse {
  success: false;
  status: 'error';
  message: string;
  errorCode?: string;
}