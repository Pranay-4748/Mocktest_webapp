import express from 'express';
import { getSubjects, createSubject, deleteSubject, getTopicsBySubject, addTopic, deleteTopic, renameTopic } from '../controllers/subject.controller.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/', getSubjects);
router.post('/', createSubject);
router.delete('/:id', deleteSubject);
router.get('/:id/topics', getTopicsBySubject);
router.post('/:id/topics', addTopic);
router.delete('/:id/topics/:topic', deleteTopic);
router.put('/:id/topics/:topic', renameTopic);

export default router;
