import { Pinecone } from '@pinecone-database/pinecone';
import pineconeService from '../../../src/services/pinecone-service';
import config from '../../../src/config';
import { PineconeUserMetadata, UserEmbedding } from '../../../src/models/types';

// Mock the Pinecone SDK
jest.mock('@pinecone-database/pinecone');

// Mock the index instance creation for the Pinecone service to spy on
const mockUpsert = jest.fn().mockResolvedValue({ upsertedCount: 1 });
const mockUpdate = jest.fn().mockResolvedValue({});
const mockQuery = jest.fn();
const mockFetch = jest.fn();
const mockDeleteOne = jest.fn().mockResolvedValue({});

// Create a single mock for the whole Pinecone SDK
jest.mock('@pinecone-database/pinecone', () => {
  return {
    Pinecone: jest.fn().mockImplementation(() => {
      return {
        index: jest.fn().mockImplementation(() => {
          return {
            namespace: jest.fn().mockImplementation(() => {
              return {
                upsert: mockUpsert,
                update: mockUpdate,
                query: mockQuery,
                fetch: mockFetch,
                deleteOne: mockDeleteOne
              };
            })
          };
        })
      };
    })
  };
});

describe('PineconeService', () => {
  // Mock data
  const mockUserId = 'user-123';
  const mockVector = Array(config.pinecone.dimension).fill(0.1);
  const mockUserEmbedding: UserEmbedding = {
    userId: mockUserId,
    vector: mockVector,
    dimension: config.pinecone.dimension,
    model: 'text-embedding-large-exp-03-07',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const mockMetadata: PineconeUserMetadata = {
    userId: mockUserId,
    seeking_match_status: true,
    opt_in_timestamp: new Date().toISOString(),
    missed_cycles_count: 0,
    updatedAt: new Date().toISOString()
  };

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertEmbedding', () => {
    it('should upsert an embedding successfully', async () => {
      const result = await pineconeService.upsertEmbedding(mockUserEmbedding, mockMetadata);
      
      expect(mockUpsert).toHaveBeenCalledWith(
        [expect.objectContaining({
          id: mockUserId,
          values: mockVector,
          metadata: expect.objectContaining({
            ...mockMetadata,
            updatedAt: expect.any(String)
          })
        })]
      );
      
      expect(result).toBe(true);
    });

    it('should throw an error if upsert fails', async () => {
      mockUpsert.mockRejectedValueOnce(new Error('Upsert failed'));
      
      await expect(pineconeService.upsertEmbedding(mockUserEmbedding, mockMetadata))
        .rejects.toThrow('Failed to upsert embedding: Upsert failed');
    });
  });

  describe('updateUserMetadata', () => {
    beforeEach(() => {
      // Mock fetchUserById response for the updateUserMetadata method
      mockFetch.mockResolvedValueOnce({
        records: {
          [mockUserId]: {
            id: mockUserId,
            metadata: mockMetadata,
            values: mockVector
          }
        }
      });
    });

    it('should update user metadata successfully', async () => {
      const updateData = { seeking_match_status: false };
      
      const result = await pineconeService.updateUserMetadata(mockUserId, updateData);
      
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUserId,
          metadata: expect.objectContaining({
            ...mockMetadata,
            ...updateData,
            updatedAt: expect.any(String)
          })
        })
      );
      
      expect(result).toBe(true);
    });

    it('should throw an error if update fails', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Update failed'));
      
      await expect(pineconeService.updateUserMetadata(mockUserId, { seeking_match_status: false }))
        .rejects.toThrow('Failed to update metadata: Update failed');
    });
    
    it('should throw an error if user is not found', async () => {
      // Reset fetch mock to return empty records
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({ records: {} });
      
      await expect(pineconeService.updateUserMetadata(mockUserId, { seeking_match_status: false }))
        .rejects.toThrow(`User ${mockUserId} not found in Pinecone, cannot update metadata.`);
    });
  });

  describe('querySimilarUsers', () => {
    beforeEach(() => {
      mockQuery.mockResolvedValue({
        matches: [
          {
            id: mockUserId,
            score: 0.95,
            metadata: mockMetadata,
            values: mockVector
          }
        ]
      });
    });

    it('should query similar users successfully', async () => {
      const result = await pineconeService.querySimilarUsers(mockVector, 10, undefined, true);
      
      expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
        vector: mockVector,
        topK: 10,
        includeValues: true,
        includeMetadata: true
      }));
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        userId: mockUserId,
        score: 0.95,
        metadata: expect.objectContaining(mockMetadata),
        vector: mockVector
      }));
    });

    it('should apply filters when provided', async () => {
      const filter = { seeking_match_status: { $eq: true } };
      
      await pineconeService.querySimilarUsers(mockVector, 10, filter);
      
      expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
        filter
      }));
    });
    
    it('should return empty array when no matches are found', async () => {
      mockQuery.mockResolvedValueOnce({ matches: [] });
      
      const result = await pineconeService.querySimilarUsers(mockVector, 10);
      
      expect(result).toEqual([]);
    });
  });

  describe('fetchUserById', () => {
    it('should fetch a user by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        records: {
          [mockUserId]: {
            id: mockUserId,
            metadata: mockMetadata,
            values: mockVector
          }
        }
      });
      
      const result = await pineconeService.fetchUserById(mockUserId);
      
      expect(mockFetch).toHaveBeenCalledWith([mockUserId]);
      
      expect(result).toEqual(expect.objectContaining({
        userId: mockUserId,
        metadata: expect.objectContaining(mockMetadata),
        vector: mockVector
      }));
    });

    it('should return null if user is not found', async () => {
      mockFetch.mockResolvedValueOnce({ records: {} });
      
      const result = await pineconeService.fetchUserById('non-existent');
      
      expect(result).toBeNull();
    });
  });

  describe('fetchUsersByIds', () => {
    it('should fetch multiple users by IDs successfully', async () => {
      const mockUserId2 = 'user-456';
      mockFetch.mockResolvedValueOnce({
        records: {
          [mockUserId]: {
            id: mockUserId,
            metadata: mockMetadata,
            values: mockVector
          },
          [mockUserId2]: {
            id: mockUserId2,
            metadata: {...mockMetadata, userId: mockUserId2},
            values: mockVector
          }
        }
      });
      
      const result = await pineconeService.fetchUsersByIds([mockUserId, mockUserId2]);
      
      expect(mockFetch).toHaveBeenCalledWith([mockUserId, mockUserId2]);
      
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(mockUserId);
      expect(result[1].userId).toBe(mockUserId2);
    });

    it('should return empty array if no userIds provided', async () => {
      const result = await pineconeService.fetchUsersByIds([]);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('fetchActiveSeekersIds', () => {
    it('should fetch active seekers IDs successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        matches: [
          { id: 'user-1' },
          { id: 'user-2' }
        ]
      });
      
      const result = await pineconeService.fetchActiveSeekersIds();
      
      expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
        filter: { seeking_match_status: { $eq: true } }
      }));
      
      expect(result).toEqual(['user-1', 'user-2']);
    });
    
    it('should return empty array when no active seekers are found', async () => {
      mockQuery.mockResolvedValueOnce({ matches: [] });
      
      const result = await pineconeService.fetchActiveSeekersIds();
      
      expect(result).toEqual([]);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      const result = await pineconeService.deleteUser(mockUserId);
      
      expect(mockDeleteOne).toHaveBeenCalledWith(mockUserId);
      expect(result).toBe(true);
    });

    it('should throw an error if deletion fails', async () => {
      mockDeleteOne.mockRejectedValueOnce(new Error('Deletion failed'));
      
      await expect(pineconeService.deleteUser(mockUserId))
        .rejects.toThrow('Failed to delete user: Deletion failed');
    });
  });
});