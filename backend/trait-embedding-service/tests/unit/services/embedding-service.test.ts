import embeddingService, { ProcessingOptions, TraitData } from '../../../src/services/embedding-service';
import s3Service from '../../../src/services/s3-service';
import vertexAIService from '../../../src/services/vertex-ai-service';
import pineconeService from '../../../src/services/pinecone-service';
import { UserTraits } from '../../../src/models/types';
import config from '../../../src/config';

// Mock dependencies
jest.mock('../../../src/services/s3-service');
jest.mock('../../../src/services/vertex-ai-service');
jest.mock('../../../src/services/pinecone-service');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

describe('EmbeddingService', () => {
  // Mock data
  const mockUserId = 'test-user-123';
  const mockTraits = ['empathetic', 'analytical', 'creative', 'detail-oriented'];
  const mockVector = Array(config.pinecone.dimension).fill(0.1);
  
  // Mock dates for consistent testing
  const mockDate = new Date('2025-05-01T12:00:00Z');
  const mockDateString = mockDate.toISOString();
  
  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock current date
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    // Mock S3 service
    (s3Service.getCachedUserTraits as jest.Mock).mockResolvedValue(null);
    (s3Service.aggregateUserTraits as jest.Mock).mockResolvedValue({
      userId: mockUserId,
      traits: mockTraits,
      createdAt: mockDateString,
      updatedAt: mockDateString,
      source: 'aggregate_chats'
    } as UserTraits);
    (s3Service.cacheUserTraits as jest.Mock).mockResolvedValue(true);
    
    // Mock Vertex AI service
    (vertexAIService.generateEmbedding as jest.Mock).mockResolvedValue(mockVector);
    
    // Mock Pinecone service
    (pineconeService.upsertEmbedding as jest.Mock).mockResolvedValue(true);
    (pineconeService.fetchUserById as jest.Mock).mockResolvedValue(null); // Default to no existing user
    (pineconeService.updateUserMetadata as jest.Mock).mockResolvedValue(true);
  });

  describe('processTraitsAndGenerateEmbedding', () => {
    it('should process traits and generate embeddings successfully', async () => {
      const options: ProcessingOptions = {
        userId: mockUserId,
        debug: true
      };
      
      const result = await embeddingService.processTraitsAndGenerateEmbedding(options);
      
      // Verify result is successful
      expect(result.success).toBe(true);
      expect(result.userId).toBe(mockUserId);
      expect(result.traits).toBeDefined();
      expect(result.combinedTraits).toEqual(mockTraits);
      expect(result.embedding).toEqual(mockVector);
      expect(result.pineconeStored).toBe(true);
      
      // Verify S3 service was called to get traits
      expect(s3Service.aggregateUserTraits).toHaveBeenCalledWith(mockUserId);
      expect(s3Service.cacheUserTraits).toHaveBeenCalled();
      
      // Verify Vertex AI was called to generate embedding
      expect(vertexAIService.generateEmbedding).toHaveBeenCalledWith(mockTraits.join('. '));
      
      // Verify Pinecone was called to store embedding
      expect(pineconeService.upsertEmbedding).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          vector: mockVector,
          dimension: config.pinecone.dimension,
          model: config.vertexAI.modelId,
        }),
        expect.objectContaining({
          userId: mockUserId,
          seeking_match_status: true,
        })
      );
    });
    
    it('should use cached traits if available', async () => {
      // Mock cached traits
      const cachedTraits: UserTraits = {
        userId: mockUserId,
        traits: mockTraits,
        createdAt: mockDateString,
        updatedAt: mockDateString,
        source: 'cached'
      };
      
      (s3Service.getCachedUserTraits as jest.Mock).mockResolvedValue(cachedTraits);
      
      const options: ProcessingOptions = {
        userId: mockUserId
      };
      
      const result = await embeddingService.processTraitsAndGenerateEmbedding(options);
      
      // Verify result is successful
      expect(result.success).toBe(true);
      expect(result.traits && result.traits[0].source).toBe('cached');
      
      // S3 aggregateUserTraits should not be called
      expect(s3Service.aggregateUserTraits).not.toHaveBeenCalled();
      // S3 cacheUserTraits should not be called
      expect(s3Service.cacheUserTraits).not.toHaveBeenCalled();
    });
    
    it('should use provided traits when specified', async () => {
      const providedTraits = ['provided-trait-1', 'provided-trait-2'];
      
      const options: ProcessingOptions = {
        userId: mockUserId,
        skipTraitExtraction: true,
        providedTraits
      };
      
      const result = await embeddingService.processTraitsAndGenerateEmbedding(options);
      
      // Verify result is successful
      expect(result.success).toBe(true);
      expect(result.traits && result.traits[0].source).toBe('provided');
      expect(result.combinedTraits).toEqual(providedTraits);
      
      // S3 service should not be called
      expect(s3Service.getCachedUserTraits).not.toHaveBeenCalled();
      expect(s3Service.aggregateUserTraits).not.toHaveBeenCalled();
      
      // Verify Vertex AI was called with provided traits
      expect(vertexAIService.generateEmbedding).toHaveBeenCalledWith(providedTraits.join('. '));
    });
    
    it('should handle errors when no traits are available', async () => {
      // Mock no traits found
      (s3Service.aggregateUserTraits as jest.Mock).mockRejectedValue(new Error('No chats found'));
      
      const options: ProcessingOptions = {
        userId: mockUserId
      };
      
      const result = await embeddingService.processTraitsAndGenerateEmbedding(options);
      
      // Verify result is failure
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected error in processing pipeline');
    });
    
    it('should handle errors from Vertex AI', async () => {
      // Mock Vertex AI error
      (vertexAIService.generateEmbedding as jest.Mock).mockRejectedValue(
        new Error('Vertex AI API error')
      );
      
      const options: ProcessingOptions = {
        userId: mockUserId
      };
      
      const result = await embeddingService.processTraitsAndGenerateEmbedding(options);
      
      // Verify result is failure
      expect(result.success).toBe(false);
      expect(result.error).toContain('Error generating embedding: Vertex AI API error');
      
      // Verify Pinecone was not called
      expect(pineconeService.upsertEmbedding).not.toHaveBeenCalled();
    });
    
    it('should handle errors from Pinecone', async () => {
      // Mock Pinecone error
      (pineconeService.upsertEmbedding as jest.Mock).mockRejectedValue(
        new Error('Pinecone API error')
      );
      
      const options: ProcessingOptions = {
        userId: mockUserId
      };
      
      const result = await embeddingService.processTraitsAndGenerateEmbedding(options);
      
      // Verify result is failure
      expect(result.success).toBe(false);
      expect(result.error).toContain('Error storing in Pinecone: Pinecone API error');
      
      // Verify traits and embedding were still generated
      expect(result.traits).toBeDefined();
      expect(result.embedding).toEqual(mockVector);
    });
  });
  
  describe('opt-in/opt-out and user status', () => {
    it('should process opt-in requests', async () => {
      // Mock processTraitsAndGenerateEmbedding 
      (embeddingService as any).processTraitsAndGenerateEmbedding = jest.fn().mockResolvedValue({
        success: true,
        userId: mockUserId
      });
      
      // Setup mock to return null for fetchUserById (no existing user)
      (pineconeService.fetchUserById as jest.Mock).mockResolvedValue(null);
      
      const result = await embeddingService.processOptInRequest(mockUserId);
      
      expect(result.status).toBe('processing');
      expect(result.userId).toBe(mockUserId);
      
      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify generating function was called
      expect((embeddingService as any).processTraitsAndGenerateEmbedding).toHaveBeenCalled();
    });
    
    it('should return completed status for already opted-in users', async () => {
      // Mock an existing user with seeking_match_status = true
      (pineconeService.fetchUserById as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        metadata: {
          userId: mockUserId,
          seeking_match_status: true,
          opt_in_timestamp: mockDateString
        }
      });
      
      const result = await embeddingService.processOptInRequest(mockUserId);
      
      expect(result.status).toBe('completed');
      expect(result.userId).toBe(mockUserId);
      
      // Generating function should not be called
      expect((embeddingService as any).processTraitsAndGenerateEmbedding).not.toHaveBeenCalled();
    });
    
    it('should process opt-out requests', async () => {
      const result = await embeddingService.processOptOutRequest(mockUserId);
      
      expect(result).toBe(true);
      expect(pineconeService.updateUserMetadata).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          seeking_match_status: false
        })
      );
    });
    
    it('should get user matching status', async () => {
      // Mock Pinecone to return user data
      (pineconeService.fetchUserById as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        metadata: {
          userId: mockUserId,
          seeking_match_status: true
        }
      });
      
      const result = await embeddingService.getUserMatchingStatus(mockUserId);
      
      expect(result).toEqual(expect.objectContaining({
        userId: mockUserId,
        seeking_match_status: true
      }));
      
      expect(pineconeService.fetchUserById).toHaveBeenCalledWith(mockUserId);
    });
    
    it('should find similar users', async () => {
      // Mock Pinecone querySimilarUsers
      const similarUsers = [
        { userId: 'similar-1', score: 0.9 },
        { userId: 'similar-2', score: 0.8 }
      ];
      
      // Mock fetchUserById to return vector
      (pineconeService.fetchUserById as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        vector: mockVector
      });
      
      (pineconeService.querySimilarUsers as jest.Mock).mockResolvedValue(similarUsers);
      
      const result = await embeddingService.findSimilarUsers(mockUserId, 2);
      
      expect(result).toEqual(similarUsers);
      expect(pineconeService.querySimilarUsers).toHaveBeenCalledWith(
        mockVector,
        2,
        { seeking_match_status: { $eq: true } },
        false
      );
    });
  });
});