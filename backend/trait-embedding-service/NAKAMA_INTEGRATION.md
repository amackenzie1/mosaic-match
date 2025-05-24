# Nakama Integration Guide

This document provides instructions for integrating the Trait Embedding Service with Nakama.

## Overview

The Trait Embedding Service is responsible for:
1. Extracting personality traits from user chat data
2. Generating embeddings using Google's Vertex AI
3. Storing these embeddings in Pinecone for similarity search
4. Finding compatible users based on embedding similarity

## Integration Options

There are two ways to integrate with Nakama:

### Option 1: HTTP API Calls

Nakama can call the service's HTTP endpoints directly:

- `POST /api/embedding/user/:userId/opt-in` - Generate and store embeddings for a user
- `GET /api/embedding/user/:userId/status` - Check a user's opt-in status
- `GET /api/pinecone/user/:userId/similar` - Find similar users
- `POST /api/embedding/user/:userId/opt-out` - Opt a user out of matching

### Option 2: Direct JavaScript Integration

For better performance and direct integration, you can import the service's core functionality into Nakama's JavaScript runtime:

1. Copy the compiled JavaScript files to Nakama's modules directory
2. Import the Nakama integration in your Nakama JavaScript code:

```javascript
// In your Nakama JavaScript module
const { nakamaIntegration } = require('./trait-embedding-service');

// Register an RPC function that Nakama clients can call
const processTraitsRpc = function(context, logger, nk, payload) {
  const userId = context.userId;
  const data = JSON.parse(payload);
  
  // Call the integration layer
  return nakamaIntegration.processUserTraits(userId, data.traits);
};

// Register the RPC handler
module.exports = {
  processTraits: processTraitsRpc
};
```

## Important Configuration Values

The service relies on these critical configuration values:

1. **Vertex AI Model**: `text-embedding-large-exp-03-07`
2. **Embedding Dimension**: `3072`
3. **Pinecone Namespace**: Configure to match your environment

## Integration Points for Nakama

Here are the key integration points with Nakama:

### 1. User Opt-In Process

When a user opts in to matching:
```javascript
const result = await nakamaIntegration.processUserTraits(userId);
if (result.success) {
  // Store success in Nakama storage
}
```

### 2. Finding Matches

For match-making cycles:
```javascript
// Get all active seekers
const activeUsers = await nakamaIntegration.getActiveSeekersIds();

// For each user, find potential matches
for (const userId of activeUsers) {
  const similarUsers = await nakamaIntegration.findSimilarUsers(userId, 10);
  // Process match-making logic in Nakama
}
```

### 3. User Status Updates

When users update their profile or matching status:
```javascript
// Opt user in/out
await nakamaIntegration.updateUserSeekingStatus(userId, true/false);

// Check user status
const status = await nakamaIntegration.getUserStatus(userId);
```

## Error Handling

The integration layer provides comprehensive error handling and logging. All methods return structured responses with:

- `success` boolean flag
- Detailed error messages when failures occur
- Full context data for debugging

## Testing and Validation

Before deploying to production:

1. Test both embedding generation and similarity search
2. Verify that embedding dimensions match (3072)
3. Confirm the correct model is being used (`text-embedding-large-exp-03-07`)
4. Test match-making with sample user data

## Troubleshooting

Common issues:

1. **Authentication Errors**: Ensure Google Cloud credentials are properly configured
2. **Dimension Mismatch**: Verify 3072-dimensional vectors are used consistently
3. **Rate Limiting**: Monitor Vertex AI quotas and adjust rate limits as needed

For additional help, refer to the service logs or contact the development team.