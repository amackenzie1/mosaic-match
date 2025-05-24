# MosaicMatch Batch Matching Service Implementation Plan

## Overview

The Batch Matching Service is a standalone application that periodically matches users who have opted into the MosaicMatch system. It fetches active seekers from Pinecone via the Trait/Embedding Microservice, performs similarity matching using vector embeddings, and creates matches based on similarity scores and wait times. The service then creates chat rooms in Nakama for matched pairs and sends notifications.

## Architecture

The Batch Matching Service consists of the following key components:

1. **Distributed Locking Mechanism** - Ensures only one instance runs at a time
2. **Active Seeker Pool Manager** - Fetches and manages the pool of active seekers
3. **Pairing Algorithm** - Matches users based on similarity and wait time
4. **Audit Table Manager** - Records match operations for recovery
5. **Nakama Integration** - Creates chat rooms and sends notifications
6. **Pinecone Integration** - Updates user metadata after matching

## Implementation Plan

### Phase 1: Project Setup (1-2 days)

1. Create the project structure:
   ```
   /batch-matching-service
     /src
       /config
       /models
       /services
       /utils
       /handlers
     /tests
     package.json
     tsconfig.json
     Dockerfile
   ```

2. Set up TypeScript, ESLint, and Jest for testing

3. Create configuration module with environment variable support:
   - API endpoints for Trait/Embedding Microservice
   - Nakama server settings
   - Cycle timing parameters
   - Authentication settings (HMAC)
   - DynamoDB/Redis configuration for locking

### Phase 2: Distributed Locking Implementation (2-3 days)

1. Create a `LockService` class:
   - Initialize DynamoDB or Redis client
   - Implement `acquireLock(cycleId)` method
   - Implement `releaseLock(cycleId)` method
   - Add heartbeat mechanism for long-running processes
   - Implement lock expiration for fail-safe

2. Test lock acquisition and release:
   - Simulate concurrent processes
   - Test lock expiration and recovery
   - Verify only one instance can acquire the lock

### Phase 3: Active Seeker Pool Management (2-3 days)

1. Create `ActivePoolService` class:
   - Implement `fetchActiveSeekersIds()` method to call microservice
   - Add retry logic for API failures
   - Implement sorting by opt-in time

2. Create `WaitBoostCalculator` class:
   - Implement algorithm to calculate wait boosts based on opt-in timestamps
   - Add normalization to ensure consistent scoring
   - Create proper scoring function

3. Test active seeker pool retrieval:
   - Mock API responses
   - Verify proper sorting and filtering
   - Test wait boost calculations

### Phase 4: Pairing Algorithm Implementation (3-5 days)

1. Create `PairingService` class:
   - Implement vector retrieval for active seekers
   - Create algorithm for similar user search
   - Implement score refinement with wait boosts
   - Add final partner selection logic

2. Implement the iterative greedy matching algorithm:
   - Sort active seekers by priority
   - For each user, find the best match above threshold
   - Remove matched users from the pool
   - Continue until no more valid matches can be made

3. Test the pairing algorithm:
   - Create test vectors and scenarios
   - Verify matching quality and fairness
   - Test edge cases (no matches, single user, etc.)

### Phase 5: Audit Table Implementation (2-3 days)

1. Create DynamoDB table for cycle audit:
   ```
   Table: MosaicMatchCycleAudit
   Primary Key: cycle_id (string)
   Sort Key: pair_key (string, e.g., user1_id_user2_id_sorted)
   Attributes:
     - user1_id (string)
     - user2_id (string)
     - score (number)
     - pinecone_metadata_updated (boolean)
     - nakama_group_created (boolean)
     - nakama_channel_id (string)
     - user1_notified (boolean)
     - user2_notified (boolean)
     - last_attempt_timestamp (string)
     - status (string, e.g., 'pending', 'completed', 'failed')
   ```

2. Create `AuditService` class:
   - Implement `createAuditEntry(cycle_id, user1_id, user2_id, score)` method
   - Add `updateAuditEntry(cycle_id, pair_key, updates)` method
   - Implement `getIncompleteEntries(cycle_id)` for recovery

3. Test the audit table operations:
   - Verify entry creation and updates
   - Test retrieval of incomplete entries
   - Ensure proper error handling

### Phase 6: Nakama Integration (3-4 days)

1. Create `NakamaService` class:
   - Implement server authentication
   - Add group chat creation method
   - Create notification sending functionality
   - Implement user profile retrieval

2. Create helper methods:
   - Generate unique group names with cycle ID
   - Format notification content with partner info
   - Handle error cases gracefully

3. Test Nakama integration:
   - Verify authentication and authorization
   - Test group chat creation
   - Confirm notification delivery
   - Check error handling

### Phase 7: Pinecone Integration (1-2 days)

1. Create `PineconeUpdateService` class:
   - Implement metadata update method for matched users
   - Add update method for unmatched users
   - Create HMAC authentication for API calls

2. Test Pinecone integration:
   - Verify authentication
   - Test metadata updates
   - Confirm error handling

### Phase 8: Main Handler Implementation (2-3 days)

1. Create `BatchMatchingHandler` class to orchestrate the process:
   - Acquire lock
   - Fetch active seekers
   - Run pairing algorithm
   - Process matches (update Pinecone, create Nakama groups, send notifications)
   - Update unmatched users
   - Release lock

2. Implement reconciliation job:
   - Check for incomplete entries from previous cycles
   - Attempt to complete the missing steps
   - Update audit entries

3. Test the complete workflow:
   - Run full process with mock services
   - Verify proper sequence of operations
   - Test recovery from various failure points

### Phase 9: Error Handling and Logging (1-2 days)

1. Implement comprehensive error handling:
   - Catch and log all errors
   - Implement proper retry logic
   - Create error reporting mechanism

2. Add structured logging:
   - Log all key operations
   - Include relevant context in logs
   - Add performance metrics

3. Test error scenarios:
   - Simulate API failures
   - Test recovery mechanisms
   - Verify proper error reporting

### Phase 10: Deployment and Configuration (2-3 days)

1. Create Dockerfile for containerization:
   - Use slim Node.js base image
   - Set up proper environment
   - Configure entry point

2. Prepare deployment artifacts:
   - Docker image
   - Environment variable templates
   - Documentation

3. Set up scheduling:
   - Configure cron job or similar
   - Set up monitoring and alerting
   - Implement health check endpoint

## Testing Strategy

### Unit Tests
- Test each service and utility class independently
- Mock dependencies for isolation
- Verify correct behavior for various inputs

### Integration Tests
- Test the interaction between services
- Use mock API responses
- Verify end-to-end functionality

### Performance Tests
- Test with various pool sizes
- Measure execution time
- Identify and address bottlenecks

### Failure Scenario Tests
- Simulate API failures
- Test recovery mechanisms
- Verify audit table functionality

## Implementation Timeline

| Phase | Description | Duration | Dependencies |
|-------|-------------|----------|--------------|
| 1 | Project Setup | 1-2 days | None |
| 2 | Distributed Locking | 2-3 days | Phase 1 |
| 3 | Active Seeker Pool | 2-3 days | Phase 1 |
| 4 | Pairing Algorithm | 3-5 days | Phase 3 |
| 5 | Audit Table | 2-3 days | Phase 1 |
| 6 | Nakama Integration | 3-4 days | Phase 1 |
| 7 | Pinecone Integration | 1-2 days | Phase 1 |
| 8 | Main Handler | 2-3 days | Phases 2-7 |
| 9 | Error Handling | 1-2 days | Phase 8 |
| 10 | Deployment | 2-3 days | Phase 9 |

Total estimated time: 19-30 days (4-6 weeks)

## Optimizations and Future Enhancements

1. **Parallel Processing** - Implement parallel processing for vector retrieval and similarity matching
2. **Caching** - Add caching for frequently accessed data
3. **Metrics Collection** - Implement detailed metrics for monitoring and optimization
4. **A/B Testing** - Add support for different matching algorithms
5. **Advanced Recovery** - Enhance recovery mechanisms for resilience

## Conclusion

The Batch Matching Service is a critical component of the MosaicMatch system. By following this implementation plan, we will create a robust, efficient, and reliable service that ensures users are matched with compatible partners while maintaining system integrity and performance.

## Dependencies

- Trait/Embedding Microservice API
- Nakama Server API
- DynamoDB or Redis for locking
- DynamoDB for audit table