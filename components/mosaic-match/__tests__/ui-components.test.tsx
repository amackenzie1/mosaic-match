/**
 * MosaicMatch UI Component Tests
 * 
 * These tests focus on the UI components of MosaicMatch feature:
 * - MatchIntroduction
 * - MatchWaitingState
 * - MatchBoard
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MatchIntroduction from '../components/MatchIntroduction';
import MatchWaitingState from '../components/MatchWaitingState';
import * as useMosaicMatchModule from '../hooks/use-mosaic-match';
import * as apiClient from '../services/api-client';
import { MockUserState } from '../services/mock-data';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the useMosaicMatch hook
jest.mock('../hooks/use-mosaic-match', () => {
  const original = jest.requireActual('../hooks/use-mosaic-match');
  return {
    ...original,
    useMosaicMatch: jest.fn()
  };
});

// Mock fetchAuthSession from aws-amplify/auth
jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn().mockResolvedValue({
    tokens: {
      accessToken: {
        payload: {
          sub: 'test-user-123',
        },
      },
    },
  }),
}));

// Mock custom drawer, header and footer components
jest.mock('@/components/custom/user-dashboard/CustomDrawer', () => {
  return function MockCustomDrawer(props: any) {
    return <div data-testid="mock-custom-drawer" {...props} />;
  };
});

jest.mock('@/components/custom/user-dashboard/Header', () => {
  return function MockHeader(props: any) {
    return <div data-testid="mock-header" {...props} />;
  };
});

jest.mock('@/components/custom/user-dashboard/Footer', () => {
  return function MockFooter(props: any) {
    return <div data-testid="mock-footer" {...props} />;
  };
});

// Mock hooks
jest.mock('@/components/ui/use-mobile', () => ({
  useIsMobile: jest.fn().mockReturnValue(false),
}));

// Mock the ThemeProvider for MatchBoard tests
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: any) => children,
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

// Mock MatchBackground component
jest.mock('../components/MatchBackground', () => {
  return function MockMatchBackground(props: any) {
    return <div data-testid="mock-match-background">{props.children}</div>;
  };
});

// Mock Typewriter component for simpler testing
jest.mock('../components/Typewriter', () => {
  return function MockTypewriter({ text, messages }: any) {
    return <div>{text || (messages && messages[0]) || ''}</div>;
  };
});

describe('MatchIntroduction Component', () => {
  test('renders introduction content correctly', () => {
    const handleFindYourTile = jest.fn();
    render(<MatchIntroduction onFindYourTile={handleFindYourTile} />);
    
    // Check for CTA button - this is a more reliable test than checking for text
    // that's inside the Typewriter component
    expect(screen.getByText('Find Your Match')).toBeInTheDocument();
    
    // Check for Terms and Policy links
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });
  
  test('calls onFindYourTile when CTA button is clicked', async () => {
    const handleFindYourTile = jest.fn();
    render(<MatchIntroduction onFindYourTile={handleFindYourTile} />);
    
    // Click the CTA button
    const button = screen.getByText('Find Your Match');
    fireEvent.click(button);
    
    // Verify callback was called
    expect(handleFindYourTile).toHaveBeenCalledTimes(1);
  });
  
  test('renders privacy policy links', () => {
    const handleFindYourTile = jest.fn();
    render(<MatchIntroduction onFindYourTile={handleFindYourTile} />);
    
    // Check for privacy policy links
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });
});

describe('MatchWaitingState Component', () => {
  test('renders processing state correctly', () => {
    render(
      <MatchWaitingState
        userId="test-user-123"
        onGoBack={jest.fn()}
        status="processing"
        waitTimeMinutes={0}
        matchingStatus={null}
        currentMatch={null}
      />
    );
    
    // Check for processing state elements
    expect(screen.getByText('Processing your profile')).toBeInTheDocument();
    expect(screen.getByText("We're analyzing your conversation patterns")).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });
  
  test('renders waiting state correctly', () => {
    render(
      <MatchWaitingState
        userId="test-user-123"
        onGoBack={jest.fn()}
        status="waiting"
        waitTimeMinutes={30}
        matchingStatus={{
          isSeekingMatch: true,
          optInTimestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          missedCyclesCount: 0
        }}
        currentMatch={null}
      />
    );
    
    // Check for waiting state elements
    expect(screen.getByText('Finding your match')).toBeInTheDocument();
    expect(screen.getByText("You're in the queue for the next matching cycle")).toBeInTheDocument();
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByText('30 minutes')).toBeInTheDocument();
  });
  
  test('renders matched state correctly', () => {
    render(
      <MatchWaitingState
        userId="test-user-123"
        onGoBack={jest.fn()}
        status="matched"
        waitTimeMinutes={45}
        matchingStatus={{
          isSeekingMatch: false,
          optInTimestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          lastMatchedCycleId: 'test-cycle-id',
          currentMatchPartnerId: 'partner-user-id',
          missedCyclesCount: 0
        }}
        currentMatch={{
          user1Id: 'test-user-123',
          user2Id: 'partner-user-id',
          score: 0.87,
          cycleId: 'test-cycle-id',
          nakamaChannelId: 'test-channel-id',
          createdAt: new Date().toISOString()
        }}
      />
    );
    
    // Check for matched state elements
    expect(screen.getByText('Match found!')).toBeInTheDocument();
    expect(screen.getByText("You've been matched with a compatible user")).toBeInTheDocument();
    expect(screen.getByText('Matched')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument(); // Match score
  });
  
  test('calls onGoBack when return button is clicked', () => {
    const handleGoBack = jest.fn();
    render(
      <MatchWaitingState
        userId="test-user-123"
        onGoBack={handleGoBack}
        status="waiting"
        waitTimeMinutes={15}
        matchingStatus={null}
        currentMatch={null}
      />
    );
    
    // Click the return button
    const button = screen.getByText('Return to introduction');
    fireEvent.click(button);
    
    // Verify callback was called
    expect(handleGoBack).toHaveBeenCalledTimes(1);
  });
  
  test('formats wait time correctly for different durations', () => {
    const { rerender } = render(
      <MatchWaitingState
        userId="test-user-123"
        onGoBack={jest.fn()}
        status="waiting"
        waitTimeMinutes={0}
        matchingStatus={null}
        currentMatch={null}
      />
    );
    
    // Less than a minute
    expect(screen.getByText('Less than a minute')).toBeInTheDocument();
    
    // Minutes only
    rerender(
      <MatchWaitingState
        userId="test-user-123"
        onGoBack={jest.fn()}
        status="waiting"
        waitTimeMinutes={1}
        matchingStatus={null}
        currentMatch={null}
      />
    );
    expect(screen.getByText('1 minute')).toBeInTheDocument();
    
    rerender(
      <MatchWaitingState
        userId="test-user-123"
        onGoBack={jest.fn()}
        status="waiting"
        waitTimeMinutes={45}
        matchingStatus={null}
        currentMatch={null}
      />
    );
    expect(screen.getByText('45 minutes')).toBeInTheDocument();
    
    // Hours and minutes
    rerender(
      <MatchWaitingState
        userId="test-user-123"
        onGoBack={jest.fn()}
        status="waiting"
        waitTimeMinutes={65}
        matchingStatus={null}
        currentMatch={null}
      />
    );
    expect(screen.getByText('1 hour 5 minutes')).toBeInTheDocument();
    
    rerender(
      <MatchWaitingState
        userId="test-user-123"
        onGoBack={jest.fn()}
        status="waiting"
        waitTimeMinutes={120}
        matchingStatus={null}
        currentMatch={null}
      />
    );
    expect(screen.getByText('2 hours')).toBeInTheDocument();
  });
});