import { TokenBucket } from '../../../src/utils/token-bucket';

describe('TokenBucket Rate Limiter', () => {
  let tokenBucket: TokenBucket;
  
  beforeEach(() => {
    // Create a token bucket with 5 tokens per second
    tokenBucket = new TokenBucket({
      tokensPerInterval: 5,
      intervalMs: 1000,
      maxBucketSize: 5 // Set this to 5 to match tokens per interval
    });
  });
  
  test('Should allow taking available tokens', () => {
    // Should be able to take 5 tokens immediately (initial fill)
    expect(tokenBucket.getTokenCount()).toBe(5);
    
    for (let i = 0; i < 5; i++) {
      expect(tokenBucket.tryTake()).toBe(true);
    }
    
    // 6th token should be unavailable
    expect(tokenBucket.tryTake()).toBe(false);
    expect(tokenBucket.getTokenCount()).toBeLessThan(1);
  });
  
  test('Should refill tokens based on elapsed time', async () => {
    // Take all available tokens
    for (let i = 0; i < 5; i++) {
      expect(tokenBucket.tryTake()).toBe(true);
    }
    
    // Wait for 500ms (should refill ~2.5 tokens)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Should be able to take 2 tokens (floor of 2.5)
    expect(tokenBucket.tryTake()).toBe(true);
    expect(tokenBucket.tryTake()).toBe(true);
    
    // 3rd token should be unavailable (only ~0.5 tokens left)
    expect(tokenBucket.tryTake()).toBe(false);
  });
  
  test('Should not exceed maxBucketSize when refilling', async () => {
    // Take 2 tokens
    expect(tokenBucket.tryTake()).toBe(true);
    expect(tokenBucket.tryTake()).toBe(true);
    
    // Wait for 3 seconds (should refill 15 tokens, but max is 5)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Should have 5 tokens now (maxBucketSize)
    expect(tokenBucket.getTokenCount()).toBe(5);
    
    // Should be able to take 5 tokens
    for (let i = 0; i < 5; i++) {
      expect(tokenBucket.tryTake()).toBe(true);
    }
    
    // 6th token should be unavailable
    expect(tokenBucket.tryTake()).toBe(false);
  });
  
  test('waitForToken should resolve when tokens become available', async () => {
    // Take all available tokens
    for (let i = 0; i < 5; i++) {
      expect(tokenBucket.tryTake()).toBe(true);
    }
    
    // Start timer
    const startTime = Date.now();
    
    // Wait for a token (should take ~200ms for 1 token to be available)
    await tokenBucket.waitForToken();
    
    const elapsedTime = Date.now() - startTime;
    
    // Verify it took at least 180ms (allowing for small timing differences)
    expect(elapsedTime).toBeGreaterThanOrEqual(180);
    
    // Verify it didn't take too long (shouldn't be more than 500ms with buffer)
    expect(elapsedTime).toBeLessThan(500);
  });
  
  test('waitForToken should throw if timeout is exceeded', async () => {
    // Take all available tokens
    for (let i = 0; i < 5; i++) {
      expect(tokenBucket.tryTake()).toBe(true);
    }
    
    // Try to wait for token with a very short timeout (should fail)
    await expect(async () => {
      await tokenBucket.waitForToken(50); // 50ms timeout, but need ~200ms for token
    }).rejects.toThrow('Rate limit exceeded');
  });
});