import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import pineconeService from '../services/pinecone-service';
import embeddingService from '../services/embedding-service';
import logger from '../utils/logger';

export const updateUserMetadata = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const metadata = req.body;
    
    logger.info(`Updating metadata for user ${userId}`);
    
    // Validate metadata
    if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Invalid metadata provided'
      });
    }
    
    const success = await pineconeService.updateUserMetadata(userId, metadata);
    
    return res.status(StatusCodes.OK).json({
      userId,
      success,
      message: 'User metadata updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Update metadata controller error: ${(error as Error).message}`);
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: (error as Error).message
    });
  }
};

export const querySimilarUsers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { topK = 10, includeVectors = false } = req.query;
    
    logger.info(`Querying similar users for ${userId}, topK=${topK}, includeVectors=${includeVectors}`);
    
    const similarUsers = await embeddingService.findSimilarUsers(
      userId, 
      parseInt(topK as string, 10), 
      includeVectors === 'true'
    );
    
    return res.status(StatusCodes.OK).json({
      userId,
      similarUsers,
      count: similarUsers.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Query similar users controller error: ${(error as Error).message}`);
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: (error as Error).message
    });
  }
};

export const getActiveSeekersIds = async (req: Request, res: Response) => {
  try {
    logger.info('Fetching active seekers IDs');
    
    const activeSeekersIds = await embeddingService.getActiveSeekersIds();
    
    return res.status(StatusCodes.OK).json({
      activeSeekersIds,
      count: activeSeekersIds.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Get active seekers controller error: ${(error as Error).message}`);
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: (error as Error).message
    });
  }
};

export const fetchUserVectors = async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body;
    const { includeVectors = true } = req.query;
    
    // Validate userIds
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Invalid userIds array provided'
      });
    }
    
    logger.info(`Fetching vectors for ${userIds.length} users, includeVectors=${includeVectors}`);
    
    // fetchUserVectors only takes userIds, it doesn't have an includeVectors parameter
    // The controller logic needs to be updated to match the service implementation
    const users = await embeddingService.fetchUserVectors(userIds);
    
    return res.status(StatusCodes.OK).json({
      users,
      count: users.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Fetch user vectors controller error: ${(error as Error).message}`);
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: (error as Error).message
    });
  }
};