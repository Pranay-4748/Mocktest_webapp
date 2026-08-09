import express from 'express';
import { getTests, getTestById, createTest, updateTest, deleteTest } from '../controllers/test.controller.js';
import { protectAdmin } from '../middleware/auth.js';
import { validateTest } from '../middleware/validateTest.js';

const router = express.Router();

router.use(protectAdmin); // all test routes require admin auth

router.get('/',     getTests);
router.get('/:id',  getTestById);
router.post('/',    validateTest, createTest);
router.put('/:id',  validateTest, updateTest);
router.delete('/:id', deleteTest);

export default router;
