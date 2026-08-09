import express from 'express';
import { getAttempts } from '../controllers/attempts.controller.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(protectAdmin);
router.get('/', getAttempts);

export default router;
