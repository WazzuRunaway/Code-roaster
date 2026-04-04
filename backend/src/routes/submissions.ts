import { Router } from 'express';
import { submitCode, getAllSubmissions, getSubmissionById } from '../controllers/submissionController';

const router = Router();

router.post('/submit', submitCode);
router.get('/submissions', getAllSubmissions);
router.get('/submissions/:id', getSubmissionById);

export default router;
