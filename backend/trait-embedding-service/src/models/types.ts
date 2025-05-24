/**
 * Core types for the Trait & Embedding Microservice
 */

// User trait data from Gemini AI analysis
export interface UserTraits {
  userId: string;
  traits: string[];
  createdAt: string;
  updatedAt: string;
  source: string;
}

// User embedding vector representation
export interface UserEmbedding {
  userId: string;
  vector: number[];
  dimension: number;
  model: string;
  createdAt: string;
  updatedAt: string;
}

// Pinecone metadata for a user
export interface PineconeUserMetadata {
  userId: string;
  seeking_match_status: boolean;
  opt_in_timestamp?: string;
  last_matched_cycle_id?: string;
  current_match_partner_id?: string;
  missed_cycles_count: number;
  last_opt_out_timestamp?: string;
  updatedAt: string;
}

// Response format for similarity search
export interface SimilaritySearchResult {
  userId: string;
  score: number;
  metadata: PineconeUserMetadata;
  vector?: number[]; // Optional, only included when requested
}

// Service configuration
export interface ServiceConfig {
  port: number;
  environment: "development" | "production" | "test";

  // API Rate Limits
  rateLimit: {
    windowMs: number; // Milliseconds
    max: number; // Max requests per window
  };

  // External API Quota Management
  vertexAI: {
    requestsPerSecond: number;
    maxConcurrent: number;
    projectId: string;
    location: string;
    modelId: string;
  };

  // Pinecone Configuration
  pinecone: {
    apiKey: string;
    environment: string;
    indexName: string;
    namespace: string;
    dimension: number;
  };

  // AWS S3 Configuration
  s3: {
    bucketName: string;
    region: string;
    personalityInsightsPrefix: string;
  };

  // Authentication Configuration
  auth: {
    hmacSecret?: string;
    mTlsEnabled: boolean;
    tokenExpirationSecs: number;
  };
}

// API Error Response
export interface ApiErrorResponse {
  status: number;
  message: string;
  error: string;
  details?: any;
}

// Opt-in Request
export interface OptInRequest {
  userId: string;
  forceRefresh?: boolean;
}

// Status of an opt-in request
export enum OptInStatus {
  ACCEPTED = "accepted",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

// Response for opt-in embedding request
export interface OptInResponse {
  userId: string;
  status: OptInStatus;
  message: string;
  timestamp: string;
}
