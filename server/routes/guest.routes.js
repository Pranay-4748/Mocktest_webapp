import express from 'express';
import { listPublishedTests, getTestWithQuestions, submitAttempt } from '../controllers/guest.controller.js';

const router = express.Router();

router.get('/tests',        listPublishedTests);
router.get('/tests/:id',    getTestWithQuestions);
router.post('/submit',      submitAttempt);

export default router;
