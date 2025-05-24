import { Pinecone } from '@pinecone-database/pinecone';

// Direct Pinecone service that bypasses the configuration issues

class DirectPineconeService {
  private pinecone: Pinecone;
  private indexName: string;
  private namespace: string;
  
  constructor(apiKey: string, environment: string, indexName: string, namespace: string = 'default') {
    console.log(`🔧 Initializing DirectPineconeService with indexName: ${indexName}, namespace: ${namespace}`);
    
    // Initialize the Pinecone client directly
    this.pinecone = new Pinecone({
      apiKey,
      environment,
    });
    
    this.indexName = indexName;
    this.namespace = namespace;
    
    console.log(`✅ DirectPineconeService initialized`);
  }
  
  /**
   * Get the Pinecone index instance
   */
  private getIndex() {
    return this.pinecone.index(this.indexName);
  }
  
  /**
   * Upsert a user embedding to Pinecone
   */
  async upsertEmbedding(userId: string, vector: number[], metadata: any = {}): Promise<boolean> {
    try {
      console.log(`📌 Upserting embedding for user: ${userId} with ${vector.length} dimensions`);
      
      const index = this.getIndex();
      
      await index.upsert([{
        id: userId,
        values: vector,
        metadata: {
          ...metadata,
          userId,
          updatedAt: new Date().toISOString(),
        }
      }], { namespace: this.namespace });
      
      console.log(`✅ Successfully upserted embedding for user: ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error upserting embedding:`, error);
      throw error;
    }
  }
  
  /**
   * Query similar users based on embedding vector
   */
  async querySimilarUsers(
    queryVector: number[], 
    topK: number = 10, 
    filter: object | undefined = undefined, 
    includeVectors: boolean = false
  ): Promise<any[]> {
    try {
      console.log(`🔍 Querying for similar users, topK: ${topK}, includeVectors: ${includeVectors}`);
      
      const index = this.getIndex();
      
      const queryResult = await index.query({
        namespace: this.namespace,
        vector: queryVector,
        topK,
        filter,
        includeMetadata: true,
        includeValues: includeVectors,
      });
      
      console.log(`✅ Query returned ${queryResult.matches.length} matches`);
      
      // Map to a standard result format
      const results = queryResult.matches.map(match => ({
        userId: match.id,
        score: match.score || 0,
        metadata: match.metadata || {},
        vector: match.values
      }));
      
      return results;
    } catch (error) {
      console.error(`❌ Error querying similar users:`, error);
      throw error;
    }
  }
}

/**
 * Creates a new DirectPineconeService instance with the given credentials
 */
export function createPineconeService(
  apiKey: string, 
  environment: string, 
  indexName: string
): DirectPineconeService {
  return new DirectPineconeService(apiKey, environment, indexName);
}