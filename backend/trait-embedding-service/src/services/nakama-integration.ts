/**
 * Nakama integration layer
 * Provides functions that can be directly called from Nakama's runtime
 */

import { ProcessingOptions, ProcessingResult } from './embedding-service';
import embeddingService from './embedding-service';
import pineconeService from './pinecone-service';
import logger from '../utils/logger';

class NakamaIntegration {
  /**
   * Entry point for Nakama to process a user's traits and generate embeddings
   * This function is designed to be called directly from Nakama's JavaScript runtime
   */
  async processUserTraits(
    userId: string, 
    providedTraits?: string[],
    debug: boolean = false
  ): Promise<ProcessingResult> {
    logger.info(`Nakama called processUserTraits for user ${userId}`);
    
    const options: ProcessingOptions = {
      userId,
      debug
    };
    
    if (providedTraits && providedTraits.length > 0) {
      options.skipTraitExtraction = true;
      options.providedTraits = providedTraits;
      logger.info(`Using ${providedTraits.length} traits provided by Nakama`);
    }
    
    return await embeddingService.processTraitsAndGenerateEmbedding(options);
  }
  
  /**
   * Find similar users for a given user
   * This function is designed to be called directly from Nakama's JavaScript runtime
   */
  async findSimilarUsers(
    userId: string,
    topK: number = 10,
    includeVectors: boolean = false
  ): Promise<any[]> {
    logger.info(`Nakama called findSimilarUsers for user ${userId}`);
    return await embeddingService.findSimilarUsers(userId, topK, includeVectors);
  }
  
  /**
   * Update a user's seeking status
   * This function is designed to be called directly from Nakama's JavaScript runtime
   */
  async updateUserSeekingStatus(
    userId: string,
    seekingStatus: boolean
  ): Promise<boolean> {
    logger.info(`Nakama updating seeking status for user ${userId} to ${seekingStatus}`);
    
    try {
      if (seekingStatus) {
        // If setting to true, make sure we have embeddings
        const userData = await pineconeService.fetchUserById(userId);
        
        if (!userData) {
          // User doesn't exist in Pinecone, try to generate embeddings
          logger.info(`User ${userId} not found in Pinecone, generating embeddings`);
          const result = await embeddingService.processTraitsAndGenerateEmbedding({
            userId,
            debug: true
          });
          
          return result.success;
        } else {
          // User exists, just update seeking status
          await pineconeService.updateUserMetadata(userId, {
            seeking_match_status: true,
            opt_in_timestamp: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          return true;
        }
      } else {
        // Setting to false (opt-out)
        await embeddingService.processOptOutRequest(userId);
        return true;
      }
    } catch (error) {
      logger.error(`Error updating seeking status: ${(error as Error).message}`);
      return false;
    }
  }
  
  /**
   * Get the current status of a user's matching profile
   * This function is designed to be called directly from Nakama's JavaScript runtime
   */
  async getUserStatus(userId: string): Promise<any> {
    logger.info(`Nakama checking status for user ${userId}`);
    
    try {
      const status = await embeddingService.getUserMatchingStatus(userId);
      return {
        userId,
        exists: status !== null,
        seeking: status?.seeking_match_status || false,
        lastOptIn: status?.opt_in_timestamp,
        lastOptOut: status?.last_opt_out_timestamp,
        currentMatchPartnerId: status?.current_match_partner_id,
        missedCycles: status?.missed_cycles_count || 0
      };
    } catch (error) {
      logger.error(`Error getting user status: ${(error as Error).message}`);
      return {
        userId,
        exists: false,
        error: (error as Error).message
      };
    }
  }
}

// Export singleton instance
export default new NakamaIntegration();