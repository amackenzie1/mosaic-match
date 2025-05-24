/**
 * MosaicMatch Feature
 * 
 * This is the main entry point for the MosaicMatch feature.
 * It provides a clean public API for the feature.
 */

// Re-export types
export * from './types';

// Re-export services
export * from './services';

// Re-export hooks
export * from './hooks';

// Re-export config
export {
  mosaicMatchConfig,
  validateMosaicMatchConfig,
  isMosaicMatchConfigured,
  getMosaicMatchUserId,
  getMatchMicroserviceEndpoint
} from './config';