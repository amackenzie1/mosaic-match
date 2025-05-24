import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { hmacAuth } from '../../../src/middleware/auth-middleware';
import embeddingRoutes from '../../../src/routes/embedding-routes';

// Mock services
jest.mock('../../../src/services/embedding-service', () => ({
  __esModule: true,
  default: {
    processOptInRequest: jest.fn().mockImplementation((userId, forceRefresh) => {
      return Promise.resolve({
        userId,
        status: 'processing',
        timestamp: new Date().toISOString()
      });
    }),
    processOptOutRequest: jest.fn().mockResolvedValue(true),
    getUserMatchingStatus: jest.fn().mockImplementation((userId) => {
      if (userId === 'existing-user') {
        return Promise.resolve({
          seeking_match_status: true,
          opt_in_timestamp: new Date().toISOString(),
          missed_cycles_count: 0
        });
      }
      return Promise.resolve(null);
    })
  }
}));

// Mock config
jest.mock('../../../src/config', () => ({
  __esModule: true,
  default: {
    auth: {
      hmacSecret: 'test-secret-key-for-hmac-authentication',
      mTlsEnabled: false,
      tokenExpirationSecs: 3600
    }
  }
}));

describe('Embedding Routes Integration Test', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(hmacAuth);
    app.use('/api/embedding', embeddingRoutes);
  });
  
  /**
   * Helper function to generate HMAC signature for test requests
   */
  /**
   * Helper function to generate HMAC signature for test requests
   * NOTE: The path in the signature must be the path that the middleware sees (req.path),
   * not the full URL path that we send the request to
   */
  const generateHmacSignature = (method: string, path: string, timestamp: string, body: any = {}) => {
    let message = `${method}${path}${timestamp}`;
    if (body && Object.keys(body).length > 0) {
      message += JSON.stringify(body);
    }
    return crypto
      .createHmac('sha256', 'test-secret-key-for-hmac-authentication')
      .update(message)
      .digest('hex');
  };
  
  test('Should process opt-in request successfully', async () => {
    const userId = `test-user-${randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // For mounted routes in our test, we need to use the full path
    const path = `/api/embedding/user/${userId}/opt-in`;
    const body = { forceRefresh: false };
    
    const signature = generateHmacSignature('POST', path, timestamp, body);
    
    const response = await request(app)
      .post(`/api/embedding/user/${userId}/opt-in`)
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp)
      .send(body);
    
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(userId);
    expect(response.body.status).toBe('processing');
  });
  
  test('Should process opt-out request successfully', async () => {
    const userId = `test-user-${randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // For mounted routes in our test, we need to use the full path
    const path = `/api/embedding/user/${userId}/opt-out`;
    
    const signature = generateHmacSignature('POST', path, timestamp);
    
    const response = await request(app)
      .post(`/api/embedding/user/${userId}/opt-out`)
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp);
    
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(userId);
    expect(response.body.success).toBe(true);
  });
  
  test('Should get matching status for existing user', async () => {
    const userId = 'existing-user';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // For mounted routes in our test, we need to use the full path
    const path = `/api/embedding/user/${userId}/status`;
    
    const signature = generateHmacSignature('GET', path, timestamp);
    
    const response = await request(app)
      .get(`/api/embedding/user/${userId}/status`)
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp);
    
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(userId);
    expect(response.body.matchingStatus.isSeekingMatch).toBe(true);
    expect(response.body.matchingStatus.hasNeverOptedIn).toBe(false);
  });
  
  test('Should get default matching status for non-existent user', async () => {
    const userId = `non-existent-user-${randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // For mounted routes in our test, we need to use the full path
    const path = `/api/embedding/user/${userId}/status`;
    
    const signature = generateHmacSignature('GET', path, timestamp);
    
    const response = await request(app)
      .get(`/api/embedding/user/${userId}/status`)
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp);
    
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(userId);
    expect(response.body.matchingStatus.isSeekingMatch).toBe(false);
    expect(response.body.matchingStatus.hasNeverOptedIn).toBe(true);
  });
});