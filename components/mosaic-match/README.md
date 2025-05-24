# MosaicMatch Feature

## Overview

MosaicMatch is a feature that pairs users with compatible communication patterns and conversation styles. It analyzes user chat data, creates embeddings representing their communication profile, and matches users based on compatibility and waiting time.

## Directory Structure

```
/components/mosaic-match/
├── __tests__/               # Unit and integration tests
├── components/              # Shared UI components
├── config/                  # Feature configuration
├── hooks/                   # React hooks for state management
├── nakama/                  # Nakama real-time components
├── services/                # Service layer for API communication
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
├── MatchBoard.tsx           # Main match board component
├── index.ts                 # Public API exports
└── README.md                # This documentation
```

## Key Components

### Types

- `config.ts`: Configuration-related types
- `matching.ts`: Types for matching process and results
- `api.ts`: API request and response types
- `index.ts`: Re-exports all types

### Services

- `api-client.ts`: Functions for communicating with the MosaicMatch microservice
- `auth.ts`: Authentication utilities for secure API communication
- `error.ts`: Error handling and user-friendly error messages
- `mock-data.ts`: Mock data for development and testing
- `nakama-client.ts`: Nakama real-time client

### Hooks

- `use-mosaic-match.ts`: Main React hook for managing matching state in components

### UI Components

- `MatchBoard.tsx`: Main entry point component for match board
- `components/`: Shared UI components for the match feature
- `nakama/`: Nakama-specific components including notifications

### Configuration

- `config.ts`: Default configuration and environment variable integration

## Usage

### Configuring MosaicMatch

To configure MosaicMatch, set the following environment variables:

```
NEXT_PUBLIC_PINECONE_API_KEY=your-api-key
NEXT_PUBLIC_PINECONE_ENVIRONMENT=your-environment
NEXT_PUBLIC_PINECONE_INDEX=mosaic-matches
NEXT_PUBLIC_VERTEX_AI_PROJECT_ID=your-project-id
NEXT_PUBLIC_VERTEX_AI_REGION=your-region
NEXT_PUBLIC_VERTEX_AI_MODEL_ID=textembedding-gecko
NEXT_PUBLIC_VERTEX_AI_SERVICE_ACCOUNT_KEY=your-service-account-key
NEXT_PUBLIC_MATCH_MICROSERVICE_URL=https://your-microservice-url
```

### Using the React Hook

```tsx
import { useMosaicMatch } from '@/components/mosaic-match/hooks';

function MyComponent() {
  const {
    status,            // 'loading', 'eligible', 'waiting', 'matched', etc.
    matchingStatus,    // Raw matching status data
    currentMatch,      // Current match data if matched
    isWaiting,         // Whether user is waiting for a match
    isMatched,         // Whether user has been matched
    waitTimeMinutes,   // Time spent waiting in minutes
    optIn,             // Function to opt in to matching
    optOut,            // Function to opt out from matching
  } = useMosaicMatch();

  // Render UI based on status
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isMatched && currentMatch) {
    return <MatchDetails match={currentMatch} />;
  }

  if (isWaiting) {
    return <WaitingUI waitTime={waitTimeMinutes} />;
  }

  return (
    <div>
      <h2>Find your match!</h2>
      <button onClick={optIn}>Opt In</button>
    </div>
  );
}
```

### Using Nakama Real-time Components

```tsx
import { NakamaProvider } from '@/components/mosaic-match/nakama';
import MatchNotification from '@/components/mosaic-match/nakama/MatchNotification';

function App() {
  return (
    <NakamaProvider>
      <MatchNotification />
      <YourAppContent />
    </NakamaProvider>
  );
}
```

### Development Mode

When running in development mode (NODE_ENV !== 'production') without a microservice URL, the feature will use mock data. You can test different states:

```tsx
import { useMosaicMatch } from '@/components/mosaic-match/hooks';

function DevelopmentTesting() {
  const { setTestState } = useMosaicMatch();

  return (
    <div>
      <button onClick={() => setTestState('new')}>Test New User</button>
      <button onClick={() => setTestState('waiting')}>Test Waiting</button>
      <button onClick={() => setTestState('matched')}>Test Matched</button>
    </div>
  );
}
```

## Testing

To run tests, you'll need to first install the testing dependencies:

```bash
# Install testing dependencies (--legacy-peer-deps is needed for React 18 compatibility)
npm install --save-dev jest ts-jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event --legacy-peer-deps
```

Then you can run the tests:

```bash
# Run all MosaicMatch tests
npm test -- components/mosaic-match

# Run specific test file
npm test -- components/mosaic-match/__tests__/services.test.ts
```

Alternatively, you can use the provided script:

```bash
# Make sure the script is executable
chmod +x run-tests.sh

# Run tests
./run-tests.sh
```