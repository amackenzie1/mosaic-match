import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import embeddingService from '../services/embedding-service';
import logger from '../utils/logger';

export const optInUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { forceRefresh } = req.body || {};
    
    logger.info(`Received opt-in request for user ${userId}`);
    
    const response = await embeddingService.processOptInRequest(userId, forceRefresh);
    
    return res.status(StatusCodes.OK).json(response);
  } catch (error) {
    logger.error(`Opt-in controller error: ${(error as Error).message}`);
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: (error as Error).message
    });
  }
};

export const optOutUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    logger.info(`Received opt-out request for user ${userId}`);
    
    const success = await embeddingService.processOptOutRequest(userId);
    
    return res.status(StatusCodes.OK).json({
      userId,
      success,
      message: 'User has been opted out from matching',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Opt-out controller error: ${(error as Error).message}`);
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: (error as Error).message
    });
  }
};

export const getUserMatchStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    logger.info(`Fetching match status for user ${userId}`);
    
    const status = await embeddingService.getUserMatchingStatus(userId);
    
    if (!status) {
      // If user doesn't exist in the system yet, return a default status with hasNeverOptedIn=true
      return res.status(StatusCodes.OK).json({
        userId,
        matchingStatus: {
          isSeekingMatch: false,
          missedCyclesCount: 0,
          hasNeverOptedIn: true
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Transform the metadata to match our API response format
    // and ensure hasNeverOptedIn flag is properly set
    const matchingStatus = {
      isSeekingMatch: status.seeking_match_status || false,
      optInTimestamp: status.opt_in_timestamp,
      lastMatchedCycleId: status.last_matched_cycle_id,
      currentMatchPartnerId: status.current_match_partner_id,
      missedCyclesCount: status.missed_cycles_count || 0,
      lastOptOutTimestamp: status.last_opt_out_timestamp,
      // A user has never opted in if they have no opt_in_timestamp 
      hasNeverOptedIn: !status.opt_in_timestamp
    };
    
    return res.status(StatusCodes.OK).json({
      userId,
      matchingStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Get status controller error: ${(error as Error).message}`);
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: (error as Error).message
    });
  }
};