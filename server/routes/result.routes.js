import express from 'express';
import { submitTest, getMyResults, getResultById } from '../controllers/student.result.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/submit', submitTest);
router.get('/my', getMyResults);
router.get('/:id', getResultById);

export default router;
