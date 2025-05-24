# Mosaic Match: Consolidated Implementation Plan (v5 - Final Production Blueprint)

**Overall Goal:** Implement a secure, scalable, and resilient user matching system where users opt-in to matching cycles. Their profiles (derived from Gemini AI analysis of chat conversations) are converted to embeddings and stored/updated in Pinecone via a dedicated, secured microservice with rate-limited external API access. A periodic, concurrency-controlled, and auditable batch process matches opted-in users based on vector similarity and seniority, creating Nakama chat rooms for assigned pairs with deduplicated notifications.

**Key Architectural Principles Based on Final Feedback:**
* **Trait/Embedding Microservice:** Handles all external calls (S3, Embedding APIs, Pinecone); secured with mTLS/HMAC. Implements request queuing & rate limiting for external APIs. Caches aggregated traits.
* **UserID Consistency:** Cognito `sub` is the canonical `GlobalUserID`.
* **Semantic Consistency:** Embedding model vendor aligned with trait generation model (Google Gemini traits -> Google Vertex AI Embeddings).
* **Concurrency Control & Idempotency:** Batch Matching Service uses distributed locking and an audit table for transactional integrity and recovery.
* **Pinecone Optimization:** Optimized data retrieval for active seekers; option for inline vector fetching for small K.
* **Privacy & Security:** Minimized data exposure; secure service communication; controlled access to Pinecone.
* **Rate Limiting:** Applied to user-facing opt-in RPC and microservice calls to external APIs.
* **Notification Deduplication:** Client-side handling for potentially retried notifications.
* **Unique Naming & State Management:** Nakama group names include cycle identifiers. Match states are robustly managed.

---

## Phase 0: Foundational Setup & Initial Configuration

**Objective:** Prepare all necessary accounts, API keys, services, and core project configurations with a strong emphasis on security and consistency.

**Tasks:**

1.  ✅ **Reorganized File Structure:** Created dedicated feature directory for MosaicMatch
   * Created structured organization under `lib/features/mosaic-match/`
   * Split types into separate files: `config.ts`, `matching.ts`, and `api.ts`
   * Created better separation of concerns with dedicated service modules
   * Extracted reusable components into `components/features/mosaic-match/common/`

2.  ✅ **Types Setup:** Define all TypeScript interfaces and types needed for MosaicMatch feature.
   * Created core type definitions in `lib/features/mosaic-match/types/`
   * Organized types by domain (config, matching, api)
   * Defined interfaces for configuration, embedding vectors, user traits, and match types

3.  ✅ **Configuration Setup:** Create configuration module with default values and environment variable support.
   * Created `lib/features/mosaic-match/config.ts` with default development configuration
   * Added helper functions to check configuration status and get user ID
   * Added validation for production environment
   * Implemented environment variable integration for production deployment

4.  ✅ **Service Layer Implementation:** Create a service layer for MosaicMatch functionality.
   * Created API client in `lib/features/mosaic-match/services/api-client.ts`
   * Implemented authentication utilities in `lib/features/mosaic-match/services/auth.ts`
   * Added error handling in `lib/features/mosaic-match/services/error.ts`
   * Created mock data for development in `lib/features/mosaic-match/services/mock-data.ts`

5.  ✅ **Frontend Hook Implementation:** Create React hook for MosaicMatch state management.
   * Implemented `useMosaicMatch` hook in `lib/features/mosaic-match/hooks/use-mosaic-match.ts`
   * Added state tracking for various matching statuses
   * Implemented auto-refresh logic for real-time status updates
   * Created user-friendly state management and error handling

6.  ✅ **UI Components Extraction:** Extracted reusable UI components.
   * Created `MatchBackground` component in `components/features/mosaic-match/common/`
   * Updated components to use the new feature structure
   * Improved component organization for better reusability

6.  ✅ **Pinecone Setup:** Index `mosaic-matches`, `cosine` metric, dimensions for Google `textembedding-gecko`. API key configured in environment variables.
   * Created Pinecone index with the required dimensions for Google's embedding model
   * Set up proper environment variables and configuration
   * Established security controls for API access

7.  ✅ **Embedding Model Access (Google Cloud Vertex AI):** GCP Project set up with Vertex AI API enabled. Using `text-embedding-large-exp-03-07` model.
   * Configured service account with proper permissions
   * Implemented authentication with both service account keys and GCP metadata server support
   * Tested model with sample trait data

8.  ✅ **Nakama Server:** Running and accessible. Cognito `sub` configured as custom auth ID (`GlobalUserID`).
   * Set up Nakama authentication bridge
   * Configured custom authentication method
   * Tested integration with frontend components

9.  ✅ **S3 Bucket for Personality Insights:** Structure `s3://.../:chat_hash:/...` implemented.
   * Created S3 service for accessing personality insights
   * Implemented proper path structure for personality insights
   * Added caching mechanisms for aggregated traits

10.  ⏳ **Distributed Lock Service:** Redis or PostgreSQL table for Batch Service lock.

11.  ✅ **Cached Aggregated Traits Store:** Implemented S3-based caching for aggregated traits.
   * Added functionality to store and retrieve cached traits
   * Implemented cache expiration logic (24-hour TTL)
   * Added cache invalidation on forced refresh

12.  ⏳ **Cycle Audit Table (NEW):**
    * Set up a table (e.g., DynamoDB or PostgreSQL) for the Batch Matching Service to record the status of pairing operations.
    * Schema: `cycle_id (PK)`, `pair_key (SK, e.g., user1ID_user2ID_sorted)`, `user1_id`, `user2_id`, `pinecone_metadata_updated (bool)`, `nakama_group_created (bool)`, `nakama_channel_id (string)`, `user1_notified (bool)`, `user2_notified (bool)`, `last_attempt_timestamp`.

13. ✅ **Environment Variables (Trait/Embedding Microservice):** Implemented configuration module with support for all required environment variables.
    * Added validation for required variables
    * Implemented fallbacks for development environment
    * Created proper configuration interfaces and types

14. ✅ **Environment Variables (Nakama Server):** Configured for authentication and RPC calls.

15. ✅ **Environment Variables (Frontend - Next.js):** Set up for API client and feature flags.

**Testing & Validation (Phase 0):** 

* ✅ **Frontend Services & Components**:
   * Verified service layer functions with mock data
   * Tested UI components with different matching statuses
   * Ensured proper error handling and fallback states
   * Confirmed responsive design and theme compatibility
   * Updated testing approach to be compatible with React 18 (replaced @testing-library/react-hooks with direct React Testing Library usage)
   * Reorganized all MosaicMatch components into a cohesive `/components/mosaic-match` directory structure

* ✅ **External Services**:
   * Tested Pinecone connectivity and operations
   * Verified Vertex AI embedding generation with rate limiting
   * Confirmed S3 access and trait aggregation
   * Tested Nakama authentication and session management

---

## Phase 1: Trait & Embedding Microservice (Server-Side, Standalone)

**Objective:** Create a secure, robust, and efficient microservice for trait processing, embedding generation, and Pinecone interactions, with proper rate limiting and authentication.

**Tasks:**

1.  ✅ **Project Setup & Security:**
    * Created standalone Express.js application with TypeScript
    * Implemented HMAC authentication for all incoming requests
    * Added proper error handling and logging
    * Containerized with Docker for easy deployment
    * Created comprehensive tests for all components

2.  ✅ **API Endpoints Design (with Auth):**
    * Implemented `/user/:globalUserID/opt-in-embedding` endpoint for user opt-in
    * Added `/user/:globalUserID/opt-out` endpoint for user opt-out
    * Created `/user/:globalUserID/status` endpoint for checking matching status
    * Implemented `/pinecone/query-similar` with optional vector inclusion
    * Added `/pinecone/active-seekers-ids` for batch service
    * Created `/pinecone/fetch-vectors-by-ids` for vector retrieval
    * Implemented `/pinecone/update-user-metadata/:userId` for metadata updates

3.  ✅ **Core Logic Implementation:**
    * **`WorkspaceUserAggregatedTraits(globalUserID, numberOfTopChats)`:** Implemented with S3 cache for aggregated traits
    * **`generateEmbeddingFromGoogleAI(textualTraits)`:** Added token bucket rate limiter for API quota management
    * **Pinecone Client & Operations:** Implemented upsert, query, updateMetadata, fetchUserById, fetchUsersByIds, fetchActiveSeekersIds, and deleteUser operations
    * Created proper integration with embedding service for trait processing pipeline

4.  ✅ **Error Handling, Logging, Configuration:** 
    * Implemented structured logging with different log levels
    * Added comprehensive error handling with proper HTTP status codes
    * Created configuration module with environment variable support
    * Added validation for required configuration parameters

**Testing & Validation (Phase 1 - Microservice):**

* ✅ **Endpoint Auth:** Tested authentication with HMAC signatures, verified token expiration and path handling
* ✅ **`/opt-in-embedding`:** Verified rate limiting with token bucket, tested with both cached and new traits
* ✅ **`/pinecone/query-similar`:** Tested with includeVectors flag for both small and large K values
* ✅ **Integration Tests:** Created comprehensive tests for embedding routes and pinecone routes
* ✅ **Unit Tests:** Added tests for token bucket, authentication middleware, and service implementations

---

## Phase 2: Nakama Authentication & User Opt-In Flow (via Microservice)

**Objective:** Securely allow authenticated users to opt into a matching cycle via a Nakama RPC, which now calls the secured Trait/Embedding Microservice.

**Tasks:**

1.  ✅ **Nakama Authentication Bridge:** Cognito `sub` is `GlobalUserID` - integrated with Nakama authenticateCustom method.
2.  ✅ **Nakama Client Configuration & Context Provider:**
    * Implemented proper Nakama client using official @heroiclabs/nakama-js SDK
    * Created a React context provider (NakamaProvider) for easy socket connection management
    * Added helper functions for managing sessions, connections, and RPC calls
    * Implemented proper configuration using environment variables
3.  ✅ **Nakama RPC: `rpc_opt_in_match`:**
    * Implemented RPC that calls the Trait/Embedding Microservice's `/user/:globalUserID/opt-in-embedding` endpoint
    * Added HMAC signature generation for secure microservice communication
    * Implemented proper error handling and response formatting
    * Added rate limiting for RPC calls
4.  ✅ **Frontend Real-time Components:**
    * Implemented MatchNotification component for real-time match notifications
    * Added client-side notification deduplication based on cycle_id and partner_id
    * Integrated sound effects for notifications
5.  ✅ **Deploy RPC to Nakama Server.**

**Testing & Validation (Phase 2 - Nakama):**

* ✅ **Authentication:** Verified Cognito integration with Nakama custom auth
* ✅ **RPC Call:** Tested opt-in RPC with proper HMAC signatures
* ✅ **Security:** Verified microservice rejects calls with incorrect/missing HMAC signatures
* ✅ **Rate Limiting:** Confirmed RPC rate limiting prevents abuse

---

## Phase 3: Client-Side UI - Opt-In Button

**Objective:** Provide the frontend for users to trigger the opt-in process.

**Tasks & Testing:** 

* ✅ **UI Implementation:** Created opt-in button component with proper state handling
* ✅ **State Management:** Implemented processing state, error handling, and success feedback
* ✅ **User Experience:** Added proper loading indicators and error messages
* ✅ **Testing:** Verified UI state transitions and error handling

---

## Phase 4: Batch Matching Service - Implementation (Standalone)

**Objective:** Implement the standalone batch service that periodically fetches active seekers (IDs first, then vectors as needed), runs the pairing algorithm, and prepares match data, with robust concurrency control.

**Tasks:**

1.  🔄 **Project Setup & Concurrency Control (Locking):** 
    * Created standalone service with TypeScript
    * Implementing distributed locking mechanism
    * Adding proper error handling and logging

2.  ✅ **Fetch Active Pool (`L_active_seekers_data`):**
    * Implemented call to Trait/Embedding Microservice: GET `/pinecone/active-seekers-ids`
    * Added proper error handling and retry logic

3.  ✅ **Pre-calculate Wait Boosts:** 
    * Implemented algorithm to calculate wait boosts based on opt-in timestamps
    * Added proper normalization for consistent scoring

4.  🔄 **Implement Pairing Algorithm (Iterative Greedy Matching):**
    * Implemented sorting of active seekers by priority
    * Added vector retrieval via `/pinecone/fetch-vectors-by-ids`
    * Implementing similar user search with `/pinecone/query-similar`
    * Adding score refinement with wait boosts
    * Currently working on the final partner selection algorithm

5.  🔄 **Output & Logging:** Implementing match results recording and proper logging

6.  ⏳ **Observability:** Planning metrics collection and monitoring

**Testing & Validation (Phase 4 - Batch Logic):**

* 🔄 **Unit Tests:** Creating tests for individual components
* 🔄 **Integration Tests:** Implementing tests for the complete batch process
* 🔄 **Performance Testing:** Planning tests with various pool sizes

---

## Phase 5: Batch Matching Service - Post-Match Actions (Transactional Integrity)

**Objective:** Finalize the batch cycle by updating states and creating Nakama resources, ensuring steps are idempotent and recoverable using an audit table.

**Tasks:**

1.  🔄 **Initialize Nakama Client for Batch Service:** Implementing secure server-to-server communication

2.  ⏳ **Process Pairs from `L_matches_found`:**
    * Planning implementation of audit table entries
    * Will implement idempotent Pinecone metadata updates
    * Will add Nakama group chat creation
    * Will implement notification sending with deduplication support

3.  ⏳ **Update Unmatched Users' Metadata:** Planning implementation to track missed cycles

4.  ⏳ **Finalize Cycle:** Will implement cycle status tracking and lock release

5.  ⏳ **Reconciliation Job/Logic:** Planning implementation of recovery logic for incomplete matches

**Testing & Validation (Phase 5 - Batch Post-Match):**

* ⏳ **Audit Table Tests:** Will verify entry creation and updates
* ⏳ **Failure Simulation:** Will test recovery from various failure scenarios
* ⏳ **E2E Tests:** Will implement full cycle testing

---

## Phase 6: Client-Side - Real-Time Match Notifications & Full Chat UI

**Objective:** Enable users to receive deduplicated match notifications, view match details, and chat.

**Tasks:**

1.  ✅ **Nakama Socket Provider & Real-time Notification Handling:**
    * Implemented SocketProvider with notification handling
    * Added client-side notification deduplication using local storage
    * Implemented proper error handling and reconnection logic

2.  ✅ **Sound Notification, Match Display UI, Chat UI:** 
    * Added sound effects for new match notifications
    * Created match display UI with partner information
    * Implemented chat UI integration with Nakama

3.  ✅ **`rpc_get_user_match_status` (calls microservice):** 
    * Implemented RPC to check current matching status
    * Added proper error handling and retry logic

**Testing & Validation (Phase 6 - Client E2E):**

* ✅ **Notification Flow:** Tested notification reception and deduplication
* ✅ **UI Components:** Verified all UI states and transitions
* ✅ **RPC Calls:** Confirmed proper handling of status checks

---

## Phase 7: Polish, Observability, Security Hardening & Advanced Features

**Objective:** Final refinements for production readiness, focusing on operational excellence and user experience.

**Tasks:** 
1.  🔄 **Security Hardening:** Currently reviewing authentication mechanisms and API permissions
2.  🔄 **UI/UX, Error Handling:** Enhancing error messages and user experience
3.  ⏳ **Observability:** Planning comprehensive monitoring and alerting
4.  ✅ **Configuration Management:** Implemented externalized configuration for all components
5.  ⏳ **Address Medium/Polish Criticisms:** Planning enhancements for unmatched users and notification improvements

**Testing & Validation (Phase 7):** 
* 🔄 **Security Reviews:** Currently performing comprehensive security audits
* ⏳ **UAT:** Planning user acceptance testing
* ⏳ **Failure Scenarios:** Will test various failure modes and recovery paths

---

## Current Implementation Status

We have made significant progress on the MosaicMatch implementation:

1. ✅ **Completed:**
   - Frontend structure, components, and hooks
   - Authentication integration with Nakama
   - Trait/Embedding Microservice core functionality
   - Integration tests for API endpoints
   - Pinecone service implementation with proper rate limiting
   - S3 service for trait aggregation and caching
   - Real-time notification components

2. 🔄 **In Progress:**
   - Batch Matching Service implementation
   - Pairing algorithm refinement
   - Nakama integration for match notifications
   - Security hardening and testing

3. ⏳ **Planned Next:**
   - Complete Batch Matching Service
   - Implement Cycle Audit Table
   - Add reconciliation logic for failed matches
   - Deploy all components to staging environment
   - Conduct comprehensive testing

## Next Steps (Prioritized)

1. **Complete Batch Matching Service Implementation:**
   - Finish the pairing algorithm implementation
   - Add proper logging and error handling
   - Implement concurrency control with distributed locking

2. **Implement Cycle Audit Table:**
   - Create DynamoDB table for tracking match pairs and their status
   - Implement transactional operations for match creation
   - Add recovery logic for failed operations

3. **Integration with Nakama for Match Creation:**
   - Implement secure communication between Batch Service and Nakama
   - Add group chat creation and user notifications
   - Test notification deduplication

4. **Comprehensive Testing:**
   - Create end-to-end tests for the complete matching cycle
   - Test failure scenarios and recovery
   - Verify security controls and rate limiting

5. **Production Readiness:**
   - Add monitoring and alerting
   - Create deployment pipelines
   - Document operations procedures
   - Conduct load testing with simulated users

## Implementation Timeline

- **Phase 4 (Batch Matching Service):** 1-2 weeks
- **Phase 5 (Post-Match Actions):** 1-2 weeks
- **Phase 7 (Polish & Hardening):** 1 week
- **Testing & Validation:** 1-2 weeks

Total estimated time to completion: 4-7 weeks, with initial testing in staging environment possible within 2-3 weeks.