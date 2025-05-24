/**
 * TokenBucket implementation for rate limiting
 * This provides a simple implementation of the token bucket algorithm
 * for rate limiting API calls
 */

interface TokenBucketOptions {
  tokensPerInterval: number;
  intervalMs: number;
  maxBucketSize?: number;
}

export class TokenBucket {
  private tokens: number;
  private lastRefillTimestamp: number;
  private tokensPerInterval: number;
  private intervalMs: number;
  private maxBucketSize: number;

  constructor(options: TokenBucketOptions) {
    this.tokensPerInterval = options.tokensPerInterval;
    this.intervalMs = options.intervalMs;
    this.maxBucketSize = options.maxBucketSize || options.tokensPerInterval;
    this.tokens = this.maxBucketSize;
    this.lastRefillTimestamp = Date.now();
  }

  /**
   * Refill the bucket based on elapsed time
   */
  private refill() {
    const now = Date.now();
    const elapsedMs = now - this.lastRefillTimestamp;
    
    // Calculate tokens to add based on elapsed time
    const tokensToAdd = (elapsedMs / this.intervalMs) * this.tokensPerInterval;
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxBucketSize, this.tokens + tokensToAdd);
      this.lastRefillTimestamp = now;
    }
  }

  /**
   * Take a token from the bucket, returns false if no tokens available
   */
  public tryTake(): boolean {
    this.refill();
    
    if (this.tokens < 1) {
      return false;
    }
    
    this.tokens -= 1;
    return true;
  }

  /**
   * Wait for a token to become available
   * @param timeout Optional timeout in milliseconds
   * @returns Promise that resolves when a token is available
   */
  public async waitForToken(timeout?: number): Promise<void> {
    // Try to take a token immediately
    if (this.tryTake()) {
      return;
    }

    // Calculate wait time for next token
    this.refill();
    const tokensNeeded = 1 - this.tokens;
    const waitTime = Math.ceil((tokensNeeded / this.tokensPerInterval) * this.intervalMs);
    
    // If we have a timeout and the wait time exceeds it, reject
    if (timeout !== undefined && waitTime > timeout) {
      throw new Error(`Rate limit exceeded, would need to wait ${waitTime}ms which exceeds timeout of ${timeout}ms`);
    }
    
    // Wait for the calculated time
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Try again after waiting
    if (!this.tryTake()) {
      // If still no tokens, throw error
      throw new Error('Unable to acquire token after waiting');
    }
  }

  /**
   * Get current token count
   */
  public getTokenCount(): number {
    this.refill();
    return this.tokens;
  }
}