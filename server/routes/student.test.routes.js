import express from 'express';
import { listPublishedTests, getTestWithQuestions } from '../controllers/student.test.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', listPublishedTests);
router.get('/:id', protect, getTestWithQuestions);

export default router;
