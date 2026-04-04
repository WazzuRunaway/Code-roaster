import { Router } from 'express';
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

const router = Router();

// Submit code
router.post('/submit', submitCode);

// Get all submissions (internal, no filter)
router.get('/submissions', getAllSubmissions);
router.get('/submissions/:id', getSubmissionById);

// Publish submission (add name + make public)
router.patch('/submissions/:id/publish', publishSubmission);

// Like submission
router.post('/submissions/:id/like', likeSubmission);

// Comments
router.get('/submissions/:id/comments', getComments);
router.post('/submissions/:id/comments', addComment);

// Public feeds
router.get('/roasted', getRecentlyRoasted);
router.get('/hallofshame', getHallOfShame);

export default router;
