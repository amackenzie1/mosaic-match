import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { hmacAuth } from '../../../src/middleware/auth-middleware';

// Mock config to use in tests
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

describe('Authentication Middleware', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Protected route with HMAC auth
    app.use('/protected', hmacAuth, (req, res) => {
      res.status(200).json({ message: 'Success' });
    });
    
    // Unprotected route
    app.use('/public', (req, res) => {
      res.status(200).json({ message: 'Public route' });
    });
  });
  
  test('Should allow access with valid HMAC signature', async () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    // In express middleware, req.path is the path AFTER the mount point
    // So for a middleware mounted at '/protected', the req.path is '/'
    const path = '/';
    const body = {};
    
    // Create message string
    let message = `${method}${path}${timestamp}`;
    if (Object.keys(body).length > 0) {
      message += JSON.stringify(body);
    }
    
    // Calculate signature
    const signature = crypto
      .createHmac('sha256', 'test-secret-key-for-hmac-authentication')
      .update(message)
      .digest('hex');
    
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp)
      .send(body);
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Success');
  });
  
  test('Should deny access without authorization header', async () => {
    const response = await request(app).get('/protected');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });
  
  test('Should deny access with invalid HMAC signature', async () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const invalidSignature = 'invalid-signature';
    
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `HMAC ${invalidSignature}`)
      .set('X-Request-Timestamp', timestamp);
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });
  
  test('Should deny access with expired timestamp', async () => {
    // Create timestamp from 10 minutes ago (beyond 5 minute window)
    const expiredTimestamp = Math.floor(Date.now() / 1000 - 600).toString();
    const method = 'GET';
    const path = '/protected';
    
    // Create message string
    const message = `${method}${path}${expiredTimestamp}`;
    
    // Calculate signature
    const signature = crypto
      .createHmac('sha256', 'test-secret-key-for-hmac-authentication')
      .update(message)
      .digest('hex');
    
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', expiredTimestamp);
    
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Request timestamp expired');
  });
  
  test('Should correctly handle request bodies in HMAC validation', async () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'POST';
    // In express middleware, req.path is the path AFTER the mount point
    // So for a middleware mounted at '/protected', the req.path is '/'
    const path = '/';
    const body = { key: 'value', nested: { prop: true } };
    
    // Create message string with body
    let message = `${method}${path}${timestamp}`;
    // Always add body for POST requests
    message += JSON.stringify(body);
    
    // Calculate signature
    const signature = crypto
      .createHmac('sha256', 'test-secret-key-for-hmac-authentication')
      .update(message)
      .digest('hex');
    
    const response = await request(app)
      .post('/protected')
      .set('Authorization', `HMAC ${signature}`)
      .set('X-Request-Timestamp', timestamp)
      .send(body);
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Success');
  });
  
  test('Public routes should be accessible without authentication', async () => {
    const response = await request(app).get('/public');
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Public route');
  });
});