import { Index, Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import config from "../config";
import {
  PineconeUserMetadata,
  SimilaritySearchResult,
  UserEmbedding,
} from "../models/types";
import logger from "../utils/logger";

// Define a generic type for Pinecone metadata to align with SDK
type SdkCompatibleMetadata = Record<string, any>;

class PineconeService {
  private pinecone: Pinecone;
  private indexName: string;
  private namespace: string;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: config.pinecone.apiKey,
    });

    this.indexName = config.pinecone.indexName;
    this.namespace = config.pinecone.namespace;

    logger.info(
      `Initialized Pinecone service for index: ${this.indexName} and namespace: ${this.namespace}`
    );
  }

  /**
   * Get the Pinecone index instance, typed for SdkCompatibleMetadata.
   */
  private getIndex(): Index<SdkCompatibleMetadata> {
    return this.pinecone.index<SdkCompatibleMetadata>(this.indexName);
  }

  private safeCastToPineconeUserMetadata(
    id: string,
    data: SdkCompatibleMetadata | undefined
  ): PineconeUserMetadata {
    const defaults: PineconeUserMetadata = {
      userId: id,
      seeking_match_status: false,
      missed_cycles_count: 0,
      updatedAt: new Date(0).toISOString(), // Default epoch timestamp
      opt_in_timestamp: undefined,
      last_matched_cycle_id: undefined,
      current_match_partner_id: undefined,
      last_opt_out_timestamp: undefined,
    };

    if (!data) {
      return defaults;
    }

    const result: PineconeUserMetadata = {
      userId: (data.userId as string) || id,
      seeking_match_status:
        typeof data.seeking_match_status === "boolean"
          ? data.seeking_match_status
          : defaults.seeking_match_status,
      missed_cycles_count:
        typeof data.missed_cycles_count === "number"
          ? data.missed_cycles_count
          : defaults.missed_cycles_count,
      updatedAt: (data.updatedAt as string) || defaults.updatedAt,
      opt_in_timestamp:
        (data.opt_in_timestamp as string | undefined) ??
        defaults.opt_in_timestamp,
      last_matched_cycle_id:
        (data.last_matched_cycle_id as string | undefined) ??
        defaults.last_matched_cycle_id,
      current_match_partner_id:
        (data.current_match_partner_id as string | undefined) ??
        defaults.current_match_partner_id,
      last_opt_out_timestamp:
        (data.last_opt_out_timestamp as string | undefined) ??
        defaults.last_opt_out_timestamp,
    };
    return result;
  }

  /**
   * Upsert a user embedding to Pinecone
   */
  async upsertEmbedding(
    userEmbedding: UserEmbedding,
    metadata: PineconeUserMetadata
  ): Promise<boolean> {
    try {
      const index = this.getIndex();
      const metadataForPinecone: SdkCompatibleMetadata = {
        ...metadata, // User provided metadata, should conform to PineconeUserMetadata
        updatedAt: new Date().toISOString(),
      };
      const record: PineconeRecord<SdkCompatibleMetadata> = {
        id: userEmbedding.userId,
        values: userEmbedding.vector,
        metadata: metadataForPinecone,
      };

      await index.namespace(this.namespace).upsert([record]);
      logger.info(`Upserted embedding for user: ${userEmbedding.userId}`);
      return true;
    } catch (error) {
      logger.error(`Error upserting embedding: ${(error as Error).message}`);
      throw new Error(
        `Failed to upsert embedding: ${(error as Error).message}`
      );
    }
  }

  /**
   * Update metadata for a user in Pinecone
   */
  async updateUserMetadata(
    userId: string,
    metadataToUpdate: Partial<PineconeUserMetadata>
  ): Promise<boolean> {
    try {
      const index = this.getIndex();
      const currentUserData = await this.fetchUserById(userId);

      if (!currentUserData) {
        throw new Error(
          `User ${userId} not found in Pinecone, cannot update metadata.`
        );
      }

      // Start with current metadata, apply partial updates, ensure critical fields, add timestamp
      const mergedMetadata: PineconeUserMetadata = {
        ...this.safeCastToPineconeUserMetadata(
          userId,
          currentUserData.metadata as SdkCompatibleMetadata
        ), // Ensure current is full PineconeUserMetadata
        ...metadataToUpdate, // Apply sparse updates from input
        userId: userId, // Ensure userId is always present and correct from the parameter
        updatedAt: new Date().toISOString(), // Set new updatedAt timestamp
      };

      // The SDK's update method performs a partial update on the metadata object in Pinecone.
      // So we send only the fields that are changing or being added.
      // However, to match the original intent of merging, we prepare a full `mergedMetadata`
      // and then pass it. Any field present in mergedMetadata will be set/overwritten.
      // Fields NOT in mergedMetadata (if it were partial) would be untouched in Pinecone.
      // By sending the full `mergedMetadata` (now including a fresh updatedAt), we ensure the record in Pinecone
      // reflects this fully merged state.
      await index.namespace(this.namespace).update({
        id: userId,
        metadata: mergedMetadata as SdkCompatibleMetadata, // Cast to SdkCompatibleMetadata for the call
      });

      logger.info(`Updated metadata for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error updating user metadata: ${(error as Error).message}`);
      throw new Error(`Failed to update metadata: ${(error as Error).message}`);
    }
  }

  /**
   * Query similar users based on embedding similarity
   */
  async querySimilarUsers(
    queryVector: number[],
    topK: number,
    filter?: SdkCompatibleMetadata,
    includeVectors: boolean = false
  ): Promise<SimilaritySearchResult[]> {
    try {
      const index = this.getIndex();
      const queryResult = await index.namespace(this.namespace).query({
        vector: queryVector,
        topK,
        filter,
        includeMetadata: true,
        includeValues: includeVectors,
      });

      logger.info(
        `Queried for similar users, found ${
          queryResult.matches?.length || 0
        } matches`
      );
      if (!queryResult.matches) return [];

      const results: SimilaritySearchResult[] = queryResult.matches.map(
        (match) => ({
          userId: match.id,
          score: match.score || 0,
          metadata: this.safeCastToPineconeUserMetadata(
            match.id,
            match.metadata
          ),
          vector: match.values,
        })
      );
      return results;
    } catch (error) {
      logger.error(`Error querying similar users: ${(error as Error).message}`);
      throw new Error(
        `Failed to query similar users: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fetch a user by ID from Pinecone
   */
  async fetchUserById(userId: string): Promise<SimilaritySearchResult | null> {
    try {
      const index = this.getIndex();
      const fetchResult = await index.namespace(this.namespace).fetch([userId]);
      const record = fetchResult.records[userId];

      if (!record) {
        logger.warn(`User ${userId} not found in Pinecone`);
        return null;
      }

      return {
        userId: userId,
        score: 1.0,
        metadata: this.safeCastToPineconeUserMetadata(
          record.id,
          record.metadata
        ),
        vector: record.values,
      };
    } catch (error) {
      logger.error(`Error fetching user by ID: ${(error as Error).message}`);
      throw new Error(`Failed to fetch user: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch multiple users by ID
   */
  async fetchUsersByIds(userIds: string[]): Promise<SimilaritySearchResult[]> {
    try {
      if (userIds.length === 0) return [];
      const index = this.getIndex();
      const fetchResult = await index.namespace(this.namespace).fetch(userIds);
      const results: SimilaritySearchResult[] = [];

      for (const id of userIds) {
        const record = fetchResult.records[id];
        if (record) {
          results.push({
            userId: id,
            score: 1.0,
            metadata: this.safeCastToPineconeUserMetadata(
              record.id,
              record.metadata
            ),
            vector: record.values,
          });
        }
      }
      logger.info(`Fetched ${results.length} users by ID`);
      return results;
    } catch (error) {
      logger.error(`Error fetching users by IDs: ${(error as Error).message}`);
      throw new Error(`Failed to fetch users: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch all active seekers (users with seeking_match_status=true)
   */
  async fetchActiveSeekersIds(): Promise<string[]> {
    try {
      const index = this.getIndex();
      const dimension = config.pinecone.dimension || 768;
      const dummyVector = new Array(dimension).fill(0);

      const queryResult = await index.namespace(this.namespace).query({
        vector: dummyVector,
        filter: { seeking_match_status: { $eq: true } as any },
        topK: 10000,
        includeMetadata: false,
        includeValues: false,
      });

      const activeSeekersIds =
        queryResult.matches?.map((match) => match.id) || [];
      logger.info(`Found ${activeSeekersIds.length} active seekers`);
      return activeSeekersIds;
    } catch (error) {
      logger.error(
        `Error fetching active seekers: ${(error as Error).message}`
      );
      throw new Error(
        `Failed to fetch active seekers: ${(error as Error).message}`
      );
    }
  }

  /**
   * Delete a user from Pinecone
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const index = this.getIndex();
      await index.namespace(this.namespace).deleteOne(userId);
      logger.info(`Deleted user ${userId} from Pinecone`);
      return true;
    } catch (error) {
      logger.error(`Error deleting user: ${(error as Error).message}`);
      throw new Error(`Failed to delete user: ${(error as Error).message}`);
    }
  }
}

export default new PineconeService();
