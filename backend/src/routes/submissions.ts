import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  submitCode,
  getAllSubmissions,
  getSubmissionById,
  publishSubmission,
  likeSubmission,
  getComments,
  addComment,
  getRecentlyRoasted,
  getHallOfShame,
} from '../controllers/submissionController';

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many submissions, please wait a bit.' },
});

const likeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many likes, slow down.' },
});

const router = Router();

// Submit code (rate limited)
router.post('/submit', submitLimiter, submitCode);

// Get all submissions (returns only public)
router.get('/submissions', getAllSubmissions);
router.get('/submissions/:id', getSubmissionById);

// Publish submission (add name + make public)
router.patch('/submissions/:id/publish', publishSubmission);

// Like submission (rate limited + IP deduplication in controller)
router.post('/submissions/:id/like', likeRateLimiter, likeSubmission);

// Comments
router.get('/submissions/:id/comments', getComments);
router.post('/submissions/:id/comments', addComment);

// Public feeds
router.get('/roasted', getRecentlyRoasted);
router.get('/hallofshame', getHallOfShame);

export default router;
