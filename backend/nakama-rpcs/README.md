# MosaicMatch Nakama RPCs

This directory contains the server-side Nakama RPC implementations that act as a bridge between the client application and the Trait/Embedding Microservice.

## Architecture

The architecture follows these security principles:

1. **Client → Nakama RPCs → Microservice**:
   - Client authenticates with Nakama using Cognito JWT tokens
   - Nakama RPCs authenticate with the microservice using HMAC signatures
   - Sensitive API keys and secrets are never exposed to the client

2. **User Identity**:
   - Cognito `sub` is used as the canonical `GlobalUserID`
   - This ID is passed from Cognito to Nakama during authentication
   - Nakama uses this ID when calling the microservice

## RPC Functions

The following RPC functions are implemented:

- **`rpc_opt_in_match`**: Opts a user into the matching system
- **`rpc_opt_out_match`**: Opts a user out of the matching system
- **`rpc_get_user_match_status`**: Gets the user's current matching status
- **`rpc_get_current_match`**: Gets the user's current match if they have one
- **`rpc_get_user_traits`**: Gets the user's aggregated traits

## Deployment

To deploy these RPCs to your Nakama server:

1. **Compile TypeScript to JavaScript**:
   ```bash
   tsc match_rpcs.ts --target ES5
   ```

2. **Copy to Nakama Modules Directory**:
   ```bash
   cp match_rpcs.js /path/to/nakama/modules/
   ```

3. **Configure Environment Variables**:
   Add the following environment variables to your Nakama server configuration:

   ```yaml
   runtime:
     env:
       - "TRAIT_EMBEDDING_SERVICE_URL=http://trait-embedding-service:3001"
       - "TRAIT_EMBEDDING_SERVICE_HMAC_SECRET=your-secret-key-here"
       - "TRAIT_EMBEDDING_SERVICE_TIMEOUT_MS=5000"
       - "TRAIT_EMBEDDING_SERVICE_RETRY_ATTEMPTS=3"
   ```

## Rate Limiting

The RPCs include rate limiting to protect against abuse:

- **Client-side**: Nakama implements RPC rate limiting per user
- **Server-side**: The microservice has its own rate limiting
- **Retry Logic**: Exponential backoff with configurable retry attempts

## Security Considerations

- **HMAC Authentication**: All microservice calls are authenticated using HMAC signatures
- **Timestamp Validation**: Prevents replay attacks
- **User Context**: User ID is obtained from the authenticated Nakama context
- **Error Handling**: Proper error handling with logging
- **No Sensitive Data**: No secrets or private keys in client-side code

## Testing

To test these RPCs:

1. Deploy to Nakama server
2. Use the Nakama console to test RPCs directly
3. Verify authentication and rate limiting work correctly
4. Monitor for errors in the Nakama server logs