/**
 * Configuration types for MosaicMatch feature
 * 
 * IMPORTANT: This file defines types for client-side safe configuration only.
 * Server-side configuration types should be defined in the backend code.
 */

// Client-safe Nakama configuration 
export interface NakamaConfig {
  serverUrl: string;  // Public URL of the Nakama server for client connections
  timeout: number;    // Client connection timeout in milliseconds
}

// UI configuration settings
export interface UIConfig {
  refreshInterval: number;  // How often to refresh data automatically
  pollInterval: number;     // How often to check if refresh is needed
}

// Overall MosaicMatch client configuration
export interface MosaicMatchConfig {
  nakama: NakamaConfig;
  ui: UIConfig;
}