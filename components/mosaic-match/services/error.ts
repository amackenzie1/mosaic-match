/**
 * MosaicMatch Error Handling
 * 
 * Centralizes error handling for MosaicMatch service
 */

/**
 * Custom error class for MosaicMatch API errors
 */
export class MosaicMatchError extends Error {
  statusCode: number;
  errorCode?: string;
  
  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.name = 'MosaicMatchError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * Handles API errors and converts them to structured errors
 * @param {Response} response - The fetch Response object
 * @returns {Promise<MosaicMatchError>} A structured error
 */
export async function handleApiError(response: Response): Promise<MosaicMatchError> {
  let errorMessage = `API Error: ${response.status} ${response.statusText}`;
  let errorCode: string | undefined;
  
  try {
    // Try to parse error details from response
    const errorData = await response.json();
    
    if (errorData.message) {
      errorMessage = errorData.message;
    }
    
    if (errorData.errorCode) {
      errorCode = errorData.errorCode;
    }
  } catch (err) {
    // If parsing fails, use default error message
    console.warn('Failed to parse error response', err);
  }
  
  return new MosaicMatchError(errorMessage, response.status, errorCode);
}

/**
 * Determines if an error should trigger a retry
 * @param {unknown} error - The error to check
 * @returns {boolean} True if the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof MosaicMatchError) {
    // Retry on server errors and certain status codes
    return (
      error.statusCode >= 500 || 
      error.statusCode === 429 || // Too Many Requests
      error.statusCode === 408    // Request Timeout
    );
  }
  
  // Network errors are generally retryable
  return error instanceof TypeError && error.message.includes('network');
}

/**
 * Map of error codes to user-friendly messages
 */
export const errorMessages = {
  'RATE_LIMITED': 'You\'ve made too many requests. Please try again later.',
  'SERVICE_UNAVAILABLE': 'The matching service is temporarily unavailable. Please try again later.',
  'INSUFFICIENT_DATA': 'We need more data to find good matches for you. Continue using the app and sharing conversations.',
  'AUTHENTICATION_FAILED': 'Authentication failed. Please sign in again.',
  'DEFAULT': 'Something went wrong. Please try again later.'
};

/**
 * Gets a user-friendly error message
 * @param {unknown} error - The error object
 * @returns {string} A user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof MosaicMatchError && error.errorCode && errorMessages[error.errorCode as keyof typeof errorMessages]) {
    return errorMessages[error.errorCode as keyof typeof errorMessages];
  }
  
  return errorMessages.DEFAULT;
}