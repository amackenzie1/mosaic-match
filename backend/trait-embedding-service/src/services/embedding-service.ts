import s3Service from './s3-service';
import vertexAIService from './vertex-ai-service';
import pineconeService from './pinecone-service';
import logger from '../utils/logger';
import { OptInResponse, OptInStatus, PineconeUserMetadata, SimilaritySearchResult, UserEmbedding, UserTraits } from '../models/types';
import config from '../config';

// Interfaces for direct trait processing (matching the working implementation)
export interface TraitData {
  source: string;
  traits: string[];
  hash?: string;
}

export interface ProcessingResult {
  success: boolean;
  userId?: string;
  traits?: TraitData[];
  combinedTraits?: string[];
  embedding?: number[];
  pineconeStored?: boolean;
  error?: string;
}

export interface ProcessingOptions {
  userId: string;
  skipTraitExtraction?: boolean;
  providedTraits?: string[];
  debug?: boolean;
}

class EmbeddingService {
  /**
   * Process the opt-in request for a user
   * This is the main entry point for the matching opt-in process
   */
  async processOptInRequest(userId: string, forceRefresh = false): Promise<OptInResponse> {
    try {
      logger.info(`Processing opt-in request for user ${userId}`);
      
      // Check if user already exists in Pinecone with active opt-in
      const existingUser = await pineconeService.fetchUserById(userId);
      
      if (existingUser && existingUser.metadata.seeking_match_status && !forceRefresh) {
        logger.info(`User ${userId} is already opted-in for matching`);
        
        return {
          userId,
          status: OptInStatus.COMPLETED,
          message: 'User is already opted in for matching',
          timestamp: new Date().toISOString()
        };
      }
      
      // Start the opt-in process
      const response: OptInResponse = {
        userId,
        status: OptInStatus.PROCESSING,
        message: 'Processing opt-in request',
        timestamp: new Date().toISOString()
      };
      
      // Begin async processing
      this.generateAndStoreEmbedding(userId, forceRefresh)
        .then(() => {
          logger.info(`Successfully processed opt-in for user ${userId}`);
        })
        .catch(error => {
          logger.error(`Error processing opt-in for user ${userId}: ${error.message}`);
        });
      
      return response;
    } catch (error) {
      logger.error(`Error initiating opt-in process: ${(error as Error).message}`);
      
      return {
        userId,
        status: OptInStatus.FAILED,
        message: `Failed to initiate opt-in: ${(error as Error).message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Process traits and generate embeddings using the enhanced approach
   * This matches the working implementation's functionality
   */
  async processTraitsAndGenerateEmbedding(
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    const { userId, skipTraitExtraction, providedTraits, debug = false } = options;
    
    try {
      if (debug) logger.info(`Starting trait processing for user ${userId}`);
      
      // STEP 1: Extract or use provided traits
      let traits: TraitData[] = [];
      let combinedTraits: string[] = [];
      
      if (!skipTraitExtraction && !providedTraits) {
        // Extract traits using the S3 approach
        if (debug) logger.info("Extracting traits from user data in S3");
        
        // Check for cached traits first
        const cachedTraits = await s3Service.getCachedUserTraits(userId);
        
        if (cachedTraits) {
          // Convert from UserTraits format to TraitData format
          traits = [{
            source: cachedTraits.source,
            traits: cachedTraits.traits
          }];
          combinedTraits = cachedTraits.traits;
          
          if (debug) logger.info(`Using ${combinedTraits.length} cached traits`);
        } else {
          // Get fresh traits
          const userTraits = await s3Service.aggregateUserTraits(userId);
          
          // Convert to the expected format
          traits = [{
            source: userTraits.source,
            traits: userTraits.traits
          }];
          combinedTraits = userTraits.traits;
          
          // Cache for future use
          await s3Service.cacheUserTraits(userTraits);
          
          if (debug) logger.info(`Generated ${combinedTraits.length} fresh traits`);
        }
      } else if (providedTraits && providedTraits.length > 0) {
        // Use provided traits
        if (debug) logger.info(`Using ${providedTraits.length} provided traits`);
        traits = [{ source: "provided", traits: providedTraits }];
        combinedTraits = providedTraits;
      } else {
        return {
          success: false,
          userId,
          error: "No traits available. Either extract from data or provide traits.",
        };
      }
      
      if (combinedTraits.length === 0) {
        return {
          success: false,
          userId,
          error: "No traits found for processing",
        };
      }
      
      // STEP 2: Generate embedding using Vertex AI
      if (debug) logger.info("Generating embedding with Vertex AI");
      const traitsText = combinedTraits.join(". ");
      
      let embedding: number[];
      try {
        embedding = await vertexAIService.generateEmbedding(traitsText);
        
        if (!embedding || embedding.length === 0) {
          return {
            success: false,
            userId,
            traits,
            combinedTraits,
            error: "Empty embedding generated by Vertex AI",
          };
        }
        
        if (debug) logger.info(`Generated ${embedding.length}-dimensional embedding`);
      } catch (embeddingError) {
        return {
          success: false,
          userId,
          traits,
          combinedTraits,
          error: `Error generating embedding: ${
            embeddingError instanceof Error ? embeddingError.message : String(embeddingError)
          }`,
        };
      }
      
      // STEP 3: Store in Pinecone
      if (debug) logger.info(`Storing embedding in Pinecone for user ${userId}`);
      try {
        const currentTimestamp = new Date().toISOString();
        const embeddingDimension = config.pinecone.dimension;
        const embeddingModel = config.vertexAI.modelId;

        const userEmbedding: UserEmbedding = {
          userId,
          vector: embedding,
          dimension: embeddingDimension,
          model: embeddingModel,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        };

        const pineconeMetadata: PineconeUserMetadata = {
          userId,
          seeking_match_status: true,
          opt_in_timestamp: currentTimestamp,
          missed_cycles_count: 0,
          updatedAt: currentTimestamp,
        };

        const success = await pineconeService.upsertEmbedding(
          userEmbedding,
          pineconeMetadata
        );

        if (!success) {
          return {
            success: false,
            userId,
            traits,
            combinedTraits,
            embedding,
            error: "Pinecone service reported failure during upsert",
          };
        }
        
        if (debug) logger.info("Successfully stored embedding in Pinecone");
      } catch (pineconeError) {
        return {
          success: false,
          userId,
          traits,
          combinedTraits,
          embedding,
          error: `Error storing in Pinecone: ${
            pineconeError instanceof Error ? pineconeError.message : String(pineconeError)
          }`,
        };
      }
      
      // Return successful result
      return {
        success: true,
        userId,
        traits,
        combinedTraits,
        embedding,
        pineconeStored: true,
      };
    } catch (error) {
      // Handle any unexpected errors
      return {
        success: false,
        userId,
        error: `Unexpected error in processing pipeline: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Generate and store a user embedding
   * This is the main worker function that runs asynchronously after an opt-in request
   */
  private async generateAndStoreEmbedding(userId: string, forceRefresh = false): Promise<boolean> {
    try {
      // Use the enhanced processing function with debug mode on
      const result = await this.processTraitsAndGenerateEmbedding({
        userId,
        skipTraitExtraction: !forceRefresh && await s3Service.getCachedUserTraits(userId) !== null,
        debug: true
      });
      
      if (!result.success) {
        logger.error(`Failed to generate embedding for user ${userId}: ${result.error}`);
        throw new Error(result.error);
      }
      
      logger.info(`Successfully generated and stored embedding for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error generating embedding for user ${userId}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Opt a user out of matching
   */
  async processOptOutRequest(userId: string): Promise<boolean> {
    try {
      // Update user metadata in Pinecone to set seeking_match_status to false
      // and record the opt-out timestamp
      await pineconeService.updateUserMetadata(userId, {
        seeking_match_status: false,
        last_opt_out_timestamp: new Date().toISOString()
      });
      
      logger.info(`Successfully opted out user ${userId} from matching`);
      return true;
    } catch (error) {
      logger.error(`Error opting out user ${userId}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get the matching status for a user
   */
  async getUserMatchingStatus(userId: string): Promise<PineconeUserMetadata | null> {
    try {
      const userData = await pineconeService.fetchUserById(userId);
      return userData?.metadata || null;
    } catch (error) {
      logger.error(`Error fetching user matching status: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get all active seekers (users with seeking_match_status=true)
   */
  async getActiveSeekersIds(): Promise<string[]> {
    try {
      return await pineconeService.fetchActiveSeekersIds();
    } catch (error) {
      logger.error(`Error fetching active seekers: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Query similar users based on a user's embedding
   */
  async findSimilarUsers(
    userId: string, 
    topK: number = 10, 
    includeVectors: boolean = false
  ): Promise<SimilaritySearchResult[]> {
    try {
      // Get the user's embedding
      const userData = await pineconeService.fetchUserById(userId);
      
      if (!userData || !userData.vector) {
        throw new Error(`No embedding found for user ${userId}`);
      }
      
      // Get similar users that are seeking matches
      const similar = await pineconeService.querySimilarUsers(
        userData.vector, 
        topK, 
        { seeking_match_status: { $eq: true } },
        includeVectors
      );
      
      // Filter out the user themselves
      return similar.filter(result => result.userId !== userId);
    } catch (error) {
      logger.error(`Error finding similar users: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Fetch vectors for multiple users by ID
   */
  async fetchUserVectors(userIds: string[]): Promise<SimilaritySearchResult[]> {
    try {
      return await pineconeService.fetchUsersByIds(userIds);
    } catch (error) {
      logger.error(`Error fetching user vectors: ${(error as Error).message}`);
      throw error;
    }
  }
}

export default new EmbeddingService();