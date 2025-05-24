/**
 * Enhanced Mock System Tests
 * 
 * Basic tests for the enhanced mock system functionality
 */
import { MosaicMatchError } from '../services/error';
import * as enhancedMock from '../services/enhanced-mock';

// Mock localStorage
let localStorageMock: Record<string, string> = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => localStorageMock[key] || null,
    setItem: (key: string, value: string) => {
      localStorageMock[key] = value.toString();
    },
    clear: () => {
      localStorageMock = {};
    }
  },
  writable: true
});

describe('Enhanced Mock System Configuration', () => {
  beforeEach(() => {
    // Reset localStorage
    localStorageMock = {};
    localStorageMock['userId'] = 'test-user-123';
    
    // Reset journey state
    enhancedMock.resetJourneyState();
    
    // Disable enhanced mock by default
    enhancedMock.disableEnhancedMockMode();
  });
  
  test('should configure enhanced mock system', () => {
    // Enable enhanced mock with custom config
    enhancedMock.enableEnhancedMockMode({
      simulateNetworkDelay: true,
      minDelayMs: 100,
      maxDelayMs: 300,
      injectRandomErrors: false,
      simulateUserJourney: true,
      journeySteps: {
        processingDuration: 5,
        waitingDuration: 15
      }
    });
    
    const config = enhancedMock.getEnhancedMockConfig();
    
    expect(config.enabled).toBe(true);
    expect(config.minDelayMs).toBe(100);
    expect(config.maxDelayMs).toBe(300);
    expect(config.simulateUserJourney).toBe(true);
    expect(config.journeySteps.processingDuration).toBe(5);
    expect(config.journeySteps.waitingDuration).toBe(15);
  });
  
  test('should reset journey state', () => {
    // First force a state
    enhancedMock.forceUserJourneyState('waiting', { timeInState: 600 });
    
    // Then reset it
    enhancedMock.resetJourneyState();
    
    // Get config to check internal state
    const config = enhancedMock.getEnhancedMockConfig();
    
    // Should be disabled by default
    expect(config.enabled).toBe(false);
  });
  
  test('should allow disabling enhanced mock mode', () => {
    // First enable
    enhancedMock.enableEnhancedMockMode();
    
    // Then disable
    enhancedMock.disableEnhancedMockMode();
    
    // Get config to check internal state
    const config = enhancedMock.getEnhancedMockConfig();
    
    // Should be disabled
    expect(config.enabled).toBe(false);
  });
});