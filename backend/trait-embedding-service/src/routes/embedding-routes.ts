import express from 'express';
import { optInUser, optOutUser, getUserMatchStatus } from '../controllers/embedding-controller';

const router = express.Router();

/**
 * @route   POST /api/embedding/user/:userId/opt-in
 * @desc    Opt a user in for matching
 * @access  Private (requires authentication)
 */
router.post('/user/:userId/opt-in', optInUser);

/**
 * @route   POST /api/embedding/user/:userId/opt-out
 * @desc    Opt a user out from matching
 * @access  Private (requires authentication)
 */
router.post('/user/:userId/opt-out', optOutUser);

/**
 * @route   GET /api/embedding/user/:userId/status
 * @desc    Get a user's matching status
 * @access  Private (requires authentication)
 */
router.get('/user/:userId/status', getUserMatchStatus);

export default router;