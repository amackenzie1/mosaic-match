/**
 * Matching types for the MosaicMatch feature
 */

// User matching status types
export interface MatchingStatus {
  isSeekingMatch: boolean;
  optInTimestamp?: string;
  lastMatchedCycleId?: string;
  currentMatchPartnerId?: string;
  missedCyclesCount: number;
  hasNeverOptedIn?: boolean;  // Added to track if user has ever opted in
  lastOptOutTimestamp?: string;  // Added to track when user last opted out
}

// Embedding vector type
export interface EmbeddingVector {
  id: string;
  values: number[];
  metadata: {
    globalUserId: string;
    seekingMatchStatus: boolean;
    optInTimestamp?: string;
    lastMatchedCycleId?: string;
    currentMatchPartnerId?: string;
    missedCyclesCount: number;
    hasNeverOptedIn?: boolean;
    lastOptOutTimestamp?: string;
  };
}

// User aggregated traits
export interface UserAggregatedTraits {
  globalUserId: string;
  traits: string[];
  lastUpdated: string;
  source?: string;
}

// Match pair type for completed matches
export interface MatchPair {
  user1Id: string;
  user2Id: string;
  score: number;
  cycleId: string;
  nakamaChannelId?: string;
  createdAt: string;
}