import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { hmacAuth } from '../../../src/middleware/auth-middleware';
import pineconeRoutes from '../../../src/routes/pinecone-routes';

// Mock services
jest.mock('../../../src/services/pinecone-service', () => ({
  __esModule: true,
  default: {
    updateUserMetadata: jest.fn().mockResolvedValue(true),
  }
}));

jest.mock('../../../src/services/embedding-service', () => ({
  __esModule: true,
  default: {
    findSimilarUsers: jest.fn().mockImplementation((userId, topK, includeVectors) => {
      if (userId === 'no-match-user') {
        return Promise.resolve([]);
      }
      
      return Promise.resolve([
        {
          userId: `similar-user-1-${randomUUID()}`,
          score: 0.92,
          metadata: {
            seeking_match_status: true,
            opt_in_timestamp: new Date().toISOString()
          }
        },
        {
          userId: `similar-user-2-${randomUUID()}`,
          score: 0.85,
          metadata: {
            seeking_match_status: true,
            opt_in_timestamp: new Date().toISOString()
          }
        }
      ]);
    }),
    getActiveSeekersIds: jest.fn().mockResolvedValue([
      `seeker-1-${randomUUID()}`,
      `seeker-2-${randomUUID()}`,
      `seeker-3-${randomUUID()}`
    ]),
    fetchUserVectors: jest.fn().mockImplementation((userIds) => {
      return Promise.resolve(
        userIds.map((id: string) => ({
          userId: id,
          metadata: {
            seeking_match_status: true,
            opt_in_timestamp: new Date().toISOString()
          },
          vector: [0.1, 0.2, 0.3, 0.4] // Always include vectors since that's what the implementation does
        }))
      );
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

describe('Pinecone Routes Integration Test', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(hmacAuth);
    app.use('/api/pinecone', pineconeRoutes);
  });
  
  /**
   * Helper function to generate HMAC signature for test requests
   * NOTE: The path in the signature must match what the middleware sees (req.path)
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
  
  test('Should update user metadata successfully', async () => {
    const userId = `test-user-${randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // For mounted routes in our test, we need to use the full path
    const path = `/api/pinecone/user/${userId}/metadata`;
    const body = {
      seeking_match_status: false,
      last_matched_cycle_id: 'cycle-123',
      last_updated: new Date().toISOString()
    };
    
    const signature = generateHmacSignature('PUT', path, timestamp, body);
    
    const response = await request(app)
      .put(`/api/pinecone/user/${userId}/metadata`)
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp)
      .send(body);
    
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(userId);
    expect(response.body.success).toBe(true);
  });
  
  test('Should query similar users successfully', async () => {
    const userId = `test-user-${randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // For mounted routes in our test, we need to use the full path
    const path = `/api/pinecone/user/${userId}/similar`;
    
    const signature = generateHmacSignature('GET', path, timestamp);
    
    const response = await request(app)
      .get(`/api/pinecone/user/${userId}/similar?topK=5&includeVectors=false`)
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp);
    
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(userId);
    expect(response.body.similarUsers).toHaveLength(2);
    expect(response.body.similarUsers[0].score).toBeGreaterThan(0.8);
  });
  
  test('Should handle case with no similar users', async () => {
    const userId = 'no-match-user';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // For mounted routes in our test, we need to use the full path
    const path = `/api/pinecone/user/${userId}/similar`;
    
    const signature = generateHmacSignature('GET', path, timestamp);
    
    const response = await request(app)
      .get(`/api/pinecone/user/${userId}/similar`)
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp);
    
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(userId);
    expect(response.body.similarUsers).toHaveLength(0);
    expect(response.body.count).toBe(0);
  });
  
  test('Should get active seekers IDs successfully', async () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // For mounted routes in our test, we need to use the full path
    const path = `/api/pinecone/active-seekers-ids`;
    
    const signature = generateHmacSignature('GET', path, timestamp);
    
    const response = await request(app)
      .get(`/api/pinecone/active-seekers-ids`)
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp);
    
    expect(response.status).toBe(200);
    expect(response.body.activeSeekersIds).toHaveLength(3);
    expect(response.body.count).toBe(3);
  });
  
  test('Should fetch vectors for multiple users by ID', async () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // For mounted routes in our test, we need to use the full path
    const path = `/api/pinecone/fetch-vectors-by-ids`;
    const body = {
      userIds: [
        `user-id-1-${randomUUID()}`,
        `user-id-2-${randomUUID()}`
      ]
    };
    
    const signature = generateHmacSignature('POST', path, timestamp, body);
    
    const response = await request(app)
      .post(`/api/pinecone/fetch-vectors-by-ids`)
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp)
      .send(body);
    
    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(2);
    expect(response.body.count).toBe(2);
  });
  
  test('Should include vectors when includeVectors=true', async () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // For mounted routes in our test, we need to use the full path
    const path = `/api/pinecone/fetch-vectors-by-ids`;
    const body = {
      userIds: [
        `user-id-1-${randomUUID()}`
      ]
    };
    
    const signature = generateHmacSignature('POST', path, timestamp, body);
    
    const response = await request(app)
      .post(`/api/pinecone/fetch-vectors-by-ids?includeVectors=true`)
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp)
      .send(body);
    
    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0].vector).toBeDefined();
    expect(response.body.users[0].vector).toHaveLength(4);
  });
});