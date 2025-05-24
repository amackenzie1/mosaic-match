import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import logger from '../utils/logger';
import { StatusCodes } from 'http-status-codes';

/**
 * HMAC authentication middleware
 * Validates requests using HMAC signatures in the Authorization header
 */
export const hmacAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!config.auth.hmacSecret) {
      throw new Error('HMAC secret not configured');
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('HMAC ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }
    
    const signature = authHeader.slice(5); // Remove 'HMAC ' prefix
    
    // Create the message string from request data
    // Format: method + path + request timestamp + request body (if any)
    const timestamp = req.headers['x-request-timestamp'] as string;
    
    if (!timestamp) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'Unauthorized',
        message: 'Missing request timestamp header'
      });
    }
    
    // Check timestamp freshness (within 5 minutes)
    const requestTime = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    
    if (Math.abs(now - requestTime) > 300) { // 5 minutes
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'Unauthorized',
        message: 'Request timestamp expired'
      });
    }
    
    // Create message string
    let message = `${req.method}${req.path}${timestamp}`;
    
    // Add body if present
    if (req.body && Object.keys(req.body).length > 0) {
      message += JSON.stringify(req.body);
    }
    
    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', config.auth.hmacSecret)
      .update(message)
      .digest('hex');
    
    // Validate signature
    if (signature !== expectedSignature) {
      logger.warn(`Invalid HMAC signature. Expected: ${expectedSignature}, Received: ${signature}`);
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'Unauthorized',
        message: 'Invalid signature'
      });
    }
    
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${(error as Error).message}`);
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Authentication error'
    });
  }
};

/**
 * JWT token authentication middleware
 * Validates a JWT token in the Authorization header
 */
export const jwtAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!config.auth.hmacSecret) {
      throw new Error('JWT secret not configured');
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }
    
    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, config.auth.hmacSecret);
    
    // Add decoded token to request object
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }
    
    logger.error(`JWT auth middleware error: ${(error as Error).message}`);
    
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: StatusCodes.UNAUTHORIZED,
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

/**
 * MTLS certificate validation middleware
 * This is a placeholder - actual mTLS implementation would be handled at the
 * load balancer or reverse proxy level in a production environment
 */
export const mtlsAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!config.auth.mTlsEnabled) {
    return next();
  }
  
  // In a real implementation, we'd validate client certificates
  // For now, we'll assume the certificate validation happens at the infrastructure level
  
  // Check for certificate information in request headers
  // These headers would be passed by a properly configured reverse proxy
  const clientCert = req.headers['x-client-cert'] as string;
  
  if (!clientCert) {
    logger.warn('No client certificate information found in request headers');
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: StatusCodes.UNAUTHORIZED,
      error: 'Unauthorized',
      message: 'Missing client certificate'
    });
  }
  
  // In production, we'd validate the certificate against a CA
  // and check if it's in a revocation list
  
  next();
};