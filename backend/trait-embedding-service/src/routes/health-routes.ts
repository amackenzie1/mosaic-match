import express from 'express';
import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger';
import pineconeService from '../services/pinecone-service';

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Simple health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  return res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    message: 'Service is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /health/ready
 * @desc    Readiness check that verifies connectivity to dependencies
 * @access  Public
 */
router.get('/ready', async (req, res) => {
  try {
    // Check Pinecone connectivity
    // We'll try a simple operation that won't modify data
    await pineconeService.fetchActiveSeekersIds();
    
    // If we reach here, we're ready
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: 'Service is ready',
      checks: {
        pinecone: 'connected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Readiness check failed: ${(error as Error).message}`);
    
    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      status: StatusCodes.SERVICE_UNAVAILABLE,
      error: 'Service Unavailable',
      message: 'Service is not ready',
      checks: {
        pinecone: 'disconnected'
      },
      details: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;