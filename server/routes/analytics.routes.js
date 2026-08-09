import express from 'express';
import { getAnalytics } from '../controllers/analytics.controller.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(protectAdmin);
router.get('/', getAnalytics);

export default router;
