import vertexAIService from '../../../src/services/vertex-ai-service';
import { TokenBucket } from '../../../src/utils/token-bucket';
import config from '../../../src/config';
import { GoogleAuth } from 'google-auth-library';

// Mock dependencies
jest.mock('../../../src/utils/token-bucket');
jest.mock('google-auth-library');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('VertexAIService', () => {
  // Mock response data
  const mockEmbedding = Array(3072).fill(0.1);
  const mockResponse = {
    predictions: [
      {
        embeddings: {
          values: mockEmbedding
        }
      }
    ]
  };

  // Mock token for authentication
  const mockToken = 'mock-access-token';
  
  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock TokenBucket
    (TokenBucket.prototype.waitForToken as jest.Mock).mockResolvedValue(undefined);
    
    // Mock fetch to return embeddings
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse)
    });
    
    // Mock GoogleAuth for local credentials
    const mockClient = {
      getAccessToken: jest.fn().mockResolvedValue({ token: mockToken })
    };
    
    (GoogleAuth as unknown as jest.Mock).mockImplementation(() => ({
      getClient: jest.fn().mockResolvedValue(mockClient)
    }));
  });

  describe('generateEmbedding', () => {
    it('should generate embeddings from text using Vertex AI', async () => {
      // Temporarily set GOOGLE_APPLICATION_CREDENTIALS for test
      const originalEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      process.env.GOOGLE_APPLICATION_CREDENTIALS = 'mock-credentials.json';
      
      const testText = 'This is a test text for embedding generation';
      const result = await vertexAIService.generateEmbedding(testText);
      
      // Verify token bucket rate limiting was used
      expect(TokenBucket.prototype.waitForToken).toHaveBeenCalled();
      
      // Verify the fetch call was made with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`https://${config.vertexAI.location}-aiplatform.googleapis.com`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`
          }),
          body: JSON.stringify({
            instances: [{ content: testText }]
          })
        })
      );
      
      // Verify the result is correct
      expect(result).toEqual(mockEmbedding);
      expect(result.length).toBe(3072); // Ensure we have the correct dimension
      
      // Restore environment
      process.env.GOOGLE_APPLICATION_CREDENTIALS = originalEnv;
    });
    
    it('should handle errors from Vertex AI API', async () => {
      // Mock an API error
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: { message: 'API error from Vertex AI' }
        }),
        statusText: 'Error'
      });
      
      const testText = 'This is a test text that will cause an error';
      
      // Set up to use metadata server auth
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '';
      process.env.K_SERVICE = 'test-service';
      
      // Mock metadata server response
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: mockToken })
        })
      ).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: { message: 'API error from Vertex AI' } }),
          statusText: 'Error'
        })
      );
      
      // Expect the call to throw
      await expect(vertexAIService.generateEmbedding(testText))
        .rejects.toThrow('Failed to generate embedding: API error: API error from Vertex AI');
      
      // Clean up
      delete process.env.K_SERVICE;
    });
    
    it('should throw error when no embeddings are returned', async () => {
      // Temporarily set GOOGLE_APPLICATION_CREDENTIALS for test
      const originalEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      process.env.GOOGLE_APPLICATION_CREDENTIALS = 'mock-credentials.json';
      
      // Mock the authentication to succeed first
      const mockClient = {
        getAccessToken: jest.fn().mockResolvedValue({ token: mockToken })
      };
      
      (GoogleAuth as unknown as jest.Mock).mockImplementation(() => ({
        getClient: jest.fn().mockResolvedValue(mockClient)
      }));
      
      // Mock a response with no embeddings
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          predictions: [{}] // Missing embeddings
        })
      });
      
      const testText = 'This is a test text that will return no embeddings';
      
      await expect(vertexAIService.generateEmbedding(testText))
        .rejects.toThrow('No embeddings returned from Vertex AI');
        
      // Restore environment
      process.env.GOOGLE_APPLICATION_CREDENTIALS = originalEnv;
    });
  });
  
  describe('generateEmbeddingsBatch', () => {
    it('should process multiple texts in batches respecting concurrency limits', async () => {
      // Temporarily set GOOGLE_APPLICATION_CREDENTIALS for test
      const originalEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      process.env.GOOGLE_APPLICATION_CREDENTIALS = 'mock-credentials.json';
      
      // Mock the authentication to succeed
      const mockClient = {
        getAccessToken: jest.fn().mockResolvedValue({ token: mockToken })
      };
      
      (GoogleAuth as unknown as jest.Mock).mockImplementation(() => ({
        getClient: jest.fn().mockResolvedValue(mockClient)
      }));
      
      // Mock successful fetch calls for each text
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });
      
      const testTexts = [
        'Text 1 for embedding',
        'Text 2 for embedding',
        'Text 3 for embedding',
        'Text 4 for embedding',
        'Text 5 for embedding'
      ];
      
      const results = await vertexAIService.generateEmbeddingsBatch(testTexts);
      
      // Verify we get the right number of results
      expect(results.length).toBe(testTexts.length);
      
      // Each result should be a 3072-dimension vector
      results.forEach(result => {
        expect(result.length).toBe(3072);
      });
      
      // Restore environment
      process.env.GOOGLE_APPLICATION_CREDENTIALS = originalEnv;
    });
  });
  
  describe('authentication', () => {
    it('should throw error when no authentication method is available', async () => {
      // Clear environment variables
      const originalGoogleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const originalKService = process.env.K_SERVICE;
      const originalGcpProject = process.env.GCP_PROJECT;
      
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      delete process.env.K_SERVICE;
      delete process.env.GCP_PROJECT;
      
      // Mock fetch to fail when called for metadata server
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Metadata server not available')
      );
      
      const testText = 'This text should fail authentication';
      
      await expect(vertexAIService.generateEmbedding(testText))
        .rejects.toThrow('Authentication failed: Neither GOOGLE_APPLICATION_CREDENTIALS nor GCP environment');
      
      // Restore environment
      process.env.GOOGLE_APPLICATION_CREDENTIALS = originalGoogleCreds;
      process.env.K_SERVICE = originalKService;
      process.env.GCP_PROJECT = originalGcpProject;
    });
  });
});