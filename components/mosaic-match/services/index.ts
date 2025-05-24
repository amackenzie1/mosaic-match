/**
 * MosaicMatch Service exports
 *
 * This file serves as the public API for the MosaicMatch service layer
 */

// Export API client functions
export {
  canUserParticipateInMatching,
  getCurrentMatch,
  getUserMatchingStatus,
  getUserTraits,
  optInToMatching,
  optOutFromMatching,
} from "./api-client";

// Export authentication utilities
export {
  getNakamaSessionToken,
  getNakamaUserId,
  isNakamaAuthenticated,
} from "./auth";

// Export error handling utilities
export {
  errorMessages,
  getUserFriendlyErrorMessage,
  handleApiError,
  isRetryableError,
  MosaicMatchError,
} from "./error";

// Export mock data utilities (for testing)
export {
  mockResponses,
  setMockUserState,
  simulateApiDelay,
  type MockUserState,
} from "./mock-data";

// Export trait processing utilities (core functionality)
export {
  extractUserTraits,
  findSimilarUsers,
  processMosaicMatchData,
  processTraitEmbeddings,
  type ProcessCallbacks,
  type TraitProcessorResult,
} from "./trait-processor";
