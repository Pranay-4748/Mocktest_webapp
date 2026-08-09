import express from 'express';
import { getSubjects, createSubject, deleteSubject } from '../controllers/subject.controller.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/', getSubjects);
router.post('/', createSubject);
router.delete('/:id', deleteSubject);

export default router;
