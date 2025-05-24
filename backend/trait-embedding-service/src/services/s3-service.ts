import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import config from '../config';
import logger from '../utils/logger';
import { UserTraits } from '../models/types';

class S3Service {
  private s3: S3Client;
  private bucketName: string;
  private personalityInsightsPrefix: string;

  constructor() {
    this.s3 = new S3Client({ 
      region: config.s3.region 
    });
    this.bucketName = config.s3.bucketName;
    this.personalityInsightsPrefix = config.s3.personalityInsightsPrefix;
    
    logger.info(`Initialized S3 service with bucket: ${this.bucketName}`);
  }

  /**
   * Get the S3 key for a user's personality insights
   */
  private getUserInsightsKey(userId: string, chatId: string): string {
    return `${this.personalityInsightsPrefix}${userId}/${chatId}/insights.json`;
  }

  /**
   * Fetch personality insights for a user's chat
   */
  async fetchChatInsights(userId: string, chatId: string): Promise<any> {
    const key = this.getUserInsightsKey(userId, chatId);
    
    try {
      logger.debug(`Fetching chat insights for user ${userId}, chat ${chatId}`);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      
      const data = await this.s3.send(command);
      
      if (!data.Body) {
        throw new Error('No data returned from S3');
      }
      
      const bodyContents = await data.Body.transformToString('utf-8');
      return JSON.parse(bodyContents);
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        logger.warn(`Chat insights not found for user ${userId}, chat ${chatId}`);
        return null;
      }
      
      logger.error(`Error fetching chat insights: ${error.message}`);
      throw new Error(`Failed to fetch chat insights: ${error.message}`);
    }
  }

  /**
   * List all chat IDs for a user
   */
  async listUserChatIds(userId: string): Promise<string[]> {
    try {
      const prefix = `${this.personalityInsightsPrefix}${userId}/`;
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Delimiter: '/',
        Prefix: prefix
      });
      
      const data = await this.s3.send(command);
      
      // Extract chat IDs from the common prefixes
      const chatIds: string[] = [];
      if (data.CommonPrefixes) {
        for (const prefixObj of data.CommonPrefixes) {
          if (prefixObj.Prefix) {
            // Extract chat ID from the prefix
            const chatId = prefixObj.Prefix.replace(prefix, '').replace('/', '');
            if (chatId) {
              chatIds.push(chatId);
            }
          }
        }
      }
      
      logger.info(`Found ${chatIds.length} chats for user ${userId}`);
      return chatIds;
    } catch (error: any) {
      logger.error(`Error listing user chat IDs: ${error.message}`);
      throw new Error(`Failed to list user chat IDs: ${error.message}`);
    }
  }

  /**
   * Aggregate user traits from their top chats
   */
  async aggregateUserTraits(userId: string, topChatCount = 5): Promise<UserTraits> {
    try {
      // List all chat IDs for the user
      const allChatIds = await this.listUserChatIds(userId);
      
      if (!allChatIds.length) {
        throw new Error(`No chats found for user ${userId}`);
      }
      
      // Sort chat IDs by most recent (assuming chat IDs contain timestamps or are sequential)
      // In a real implementation, we'd use additional metadata to determine which chats are most relevant
      const topChatIds = allChatIds.slice(0, topChatCount);
      
      // Fetch insights for each chat
      const insightsPromises = topChatIds.map(chatId => this.fetchChatInsights(userId, chatId));
      const insightsResults = await Promise.all(insightsPromises);
      
      // Filter out null results and aggregate traits
      const validInsights = insightsResults.filter(insight => insight !== null);
      
      if (!validInsights.length) {
        throw new Error(`No valid insights found for user ${userId}`);
      }
      
      // Extract and combine traits from all insights
      // This is a simplified approach - in production, we'd have a more sophisticated
      // algorithm for trait aggregation and weighting based on recency, chat importance, etc.
      const allTraits: string[] = [];
      
      for (const insight of validInsights) {
        if (insight.personalityTraits && Array.isArray(insight.personalityTraits)) {
          allTraits.push(...insight.personalityTraits);
        }
        
        if (insight.communicationStyle && typeof insight.communicationStyle === 'string') {
          allTraits.push(insight.communicationStyle);
        }
        
        if (insight.interests && Array.isArray(insight.interests)) {
          allTraits.push(...insight.interests.map((interest: string) => `Interested in ${interest}`));
        }
      }
      
      // Remove duplicates and format
      const uniqueTraits = [...new Set(allTraits)];
      
      // Build the user traits object
      const userTraits: UserTraits = {
        userId,
        traits: uniqueTraits,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'aggregate_chats'
      };
      
      logger.info(`Aggregated ${uniqueTraits.length} traits for user ${userId}`);
      return userTraits;
    } catch (error) {
      logger.error(`Error aggregating user traits: ${(error as Error).message}`);
      throw new Error(`Failed to aggregate user traits: ${(error as Error).message}`);
    }
  }

  /**
   * Store aggregated user traits in S3 (for caching)
   */
  async cacheUserTraits(userTraits: UserTraits): Promise<boolean> {
    try {
      const key = `${this.personalityInsightsPrefix}${userTraits.userId}/aggregated_traits.json`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(userTraits),
        ContentType: 'application/json'
      });
      
      await this.s3.send(command);
      
      logger.info(`Cached aggregated traits for user ${userTraits.userId}`);
      return true;
    } catch (error: any) {
      logger.error(`Error caching user traits: ${error.message}`);
      throw new Error(`Failed to cache user traits: ${error.message}`);
    }
  }

  /**
   * Retrieve cached aggregated user traits from S3
   */
  async getCachedUserTraits(userId: string): Promise<UserTraits | null> {
    try {
      const key = `${this.personalityInsightsPrefix}${userId}/aggregated_traits.json`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      
      const data = await this.s3.send(command);
      
      if (!data.Body) {
        return null;
      }
      
      const bodyContents = await data.Body.transformToString('utf-8');
      const userTraits = JSON.parse(bodyContents) as UserTraits;
      
      // Check if the cache is fresh (less than 24 hours old)
      const cacheAge = Date.now() - new Date(userTraits.updatedAt).getTime();
      const cacheExpirationMs = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge > cacheExpirationMs) {
        logger.info(`Cached traits for user ${userId} are stale (${cacheAge}ms old)`);
        return null;
      }
      
      logger.info(`Retrieved cached traits for user ${userId}`);
      return userTraits;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        logger.info(`No cached traits found for user ${userId}`);
        return null;
      }
      
      logger.error(`Error retrieving cached traits: ${error.message}`);
      return null; // Fail open for cache misses
    }
  }
}

export default new S3Service();