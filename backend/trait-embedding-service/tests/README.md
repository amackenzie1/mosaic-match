# MosaicMatch Trait & Embedding Service Tests

This directory contains tests for the MosaicMatch Trait & Embedding Microservice.

## Test Structure

- `unit/`: Unit tests for individual functions and classes
- `integration/`: Integration tests for service components
  - `services/`: Tests for service integrations (Pinecone, S3, Vertex AI)
  - `middleware/`: Tests for middleware components (auth, rate limiting)
  - `utils/`: Tests for utility functions and classes

## Running Tests

Use the included test runner script:

```bash
# Run local tests only (no external API calls)
./test-runner.sh

# Run all tests (including external API calls)
./test-runner.sh all

# Run only Pinecone tests
./test-runner.sh pinecone
```

## Test Considerations

### Rate Limits

The tests for external services (Pinecone, Vertex AI, S3) are designed to be mindful of rate limits:

- **Pinecone**: Free tier has limited operations per month; tests create minimal vectors
- **Vertex AI**: Has quotas for embedding generation requests
- **S3**: Has request limits and potential costs for storage/retrieval

### Authentication

- **HMAC Authentication**: Tests verify signature generation and validation
- **mTLS**: Would be tested in a deployment environment with proper certificates

### Performance

The token bucket rate limiter tests verify that API calls are properly throttled to avoid hitting rate limits.

## Running in CI/CD

For CI/CD pipelines, use environment variables to provide the necessary API keys and secrets. Local tests can be run without these since they mock external dependencies.