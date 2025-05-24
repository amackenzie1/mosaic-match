import express from 'express';
import { 
  updateUserMetadata, 
  querySimilarUsers, 
  getActiveSeekersIds,
  fetchUserVectors
} from '../controllers/pinecone-controller';

const router = express.Router();

/**
 * @route   PUT /api/pinecone/user/:userId/metadata
 * @desc    Update user metadata in Pinecone
 * @access  Private (requires authentication)
 */
router.put('/user/:userId/metadata', updateUserMetadata);

/**
 * @route   GET /api/pinecone/user/:userId/similar
 * @desc    Find similar users based on embedding vector
 * @access  Private (requires authentication)
 */
router.get('/user/:userId/similar', querySimilarUsers);

/**
 * @route   GET /api/pinecone/active-seekers-ids
 * @desc    Get IDs of all active seekers
 * @access  Private (requires authentication)
 */
router.get('/active-seekers-ids', getActiveSeekersIds);

/**
 * @route   POST /api/pinecone/fetch-vectors-by-ids
 * @desc    Fetch vectors for multiple users by ID
 * @access  Private (requires authentication)
 */
router.post('/fetch-vectors-by-ids', fetchUserVectors);

export default router;