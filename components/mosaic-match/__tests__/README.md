# MosaicMatch Testing Guide

This directory contains the test suite for the MosaicMatch feature. This guide explains the testing approach and how to run the tests effectively without requiring a Nakama server deployment.

## Test Files Overview

- `hooks.test.tsx` - Basic tests for the `useMosaicMatch` hook
- `hooks-advanced.test.tsx` - Advanced tests for complex hook behaviors
- `services.test.ts` - Basic tests for API client services
- `services-advanced.test.ts` - Advanced tests for error handling and response parsing
- `ui-components.test.tsx` - Tests for UI components (MatchBoard, MatchIntroduction, MatchWaitingState)
- `enhanced-mock.test.ts` - Demonstrates the enhanced mock system capabilities

## Enhanced Mock System

The enhanced mock system allows testing the MosaicMatch feature without requiring a Nakama server deployment. It provides:

- Full user journey simulation
- Controlled state transitions
- Network delay simulation
- Error injection
- Testing helper functions

### Using the Enhanced Mock System

To use the enhanced mock system in your tests:

```typescript
import * as enhancedMock from '../services/enhanced-mock';

// Enable enhanced mock with custom configuration
enhancedMock.enableEnhancedMockMode({
  simulateNetworkDelay: true,
  minDelayMs: 100,
  maxDelayMs: 300,
  injectRandomErrors: false,
  simulateUserJourney: true,
  journeySteps: {
    processingDuration: 5,   // Seconds to stay in processing state
    waitingDuration: 15      // Seconds to stay in waiting state before auto-matching
  }
});

// Force a specific state for testing
enhancedMock.forceUserJourneyState('waiting', { 
  timeInState: 600    // Simulate being in waiting state for 10 minutes
});

// Inject a specific error on the next API call
enhancedMock.injectErrorOnNext(new MosaicMatchError('Test error', 500));

// Reset to initial state
enhancedMock.resetJourneyState();

// Disable enhanced mock
enhancedMock.disableEnhancedMockMode();
```

## Test Configuration

The tests use Jest and React Testing Library. Key configurations:

- `jest.mock('../services/api-client')` - Mocks API client functions
- `jest.mock('next/navigation')` - Mocks Next.js navigation
- `jest.mock('aws-amplify/auth')` - Mocks Amplify authentication
- `jest.mock('@/hooks/use-mobile')` - Mocks mobile detection hook
- `localStorage` mock - Simulates browser localStorage

## Running the Tests

To run all MosaicMatch tests:

```bash
npm test -- components/mosaic-match
```

To run a specific test file:

```bash
npm test -- components/mosaic-match/__tests__/ui-components.test.tsx
```

To run tests with coverage:

```bash
npm test -- components/mosaic-match --coverage
```

## Testing User Journeys

The tests cover all the main user journeys through the MosaicMatch feature:

1. **First-time user journey**:
   - User views introduction screen
   - User opts in to matching
   - User enters processing state
   - User enters waiting state
   - User gets matched
   - User views match details

2. **Error handling journeys**:
   - Network errors during API calls
   - Server errors (5xx)
   - Client errors (4xx)
   - Authentication errors

3. **Edge cases**:
   - Long wait times
   - Missing user data
   - Invalid configuration
   - Incomplete responses

## Mocking Nakama Backend

The Nakama backend is mocked at multiple levels:

1. **Basic mocking** - Simple mock responses in `mock-data.ts`
2. **Enhanced mocking** - Advanced simulation in `enhanced-mock.ts`
3. **RPC mocking** - Direct mocks of Nakama RPC functions in tests

For real Nakama deployment testing, separate integration tests would be needed running against a test Nakama instance.

## Common Testing Patterns

### Testing State Transitions

```typescript
// Initial state
expect(result.current.status).toBe('eligible');

// Transition to new state
await act(async () => {
  await result.current.optIn();
});

// Verify new state
expect(result.current.status).toBe('processing');
```

### Testing UI Components

```typescript
// Render component with props
render(
  <MatchWaitingState
    userId="test-user-123"
    onGoBack={handleGoBack}
    status="waiting"
    waitTimeMinutes={30}
    matchingStatus={{...}}
    currentMatch={null}
  />
);

// Check for specific UI elements
expect(screen.getByText('Finding your match')).toBeInTheDocument();

// Trigger user interactions
fireEvent.click(screen.getByText('Return to introduction'));
expect(handleGoBack).toHaveBeenCalledTimes(1);
```

### Testing Error Conditions

```typescript
// Mock error response
enhancedMock.injectErrorOnNext(new MosaicMatchError('Server error', 500));

// Verify error handling
await expect(apiClient.getUserMatchingStatus()).rejects.toThrow('Server error');
```

## Best Practices

1. **Reset mocks between tests** - Use `beforeEach` to reset all mocks
2. **Mock minimal dependencies** - Only mock what's necessary
3. **Test both success and failure paths** - Ensure error handling works
4. **Use act() for state updates** - Wrap async operations in `act()`
5. **Check multiple assertions** - Test various aspects of each component/hook

## Extending the Tests

When adding new functionality to MosaicMatch:

1. Add tests for the new features in the appropriate test file
2. Update mock data and enhanced mock as needed
3. Consider adding new test files for complex features
4. Keep UI component tests separate from hook and service tests