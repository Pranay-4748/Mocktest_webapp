import express from 'express';
import {
  getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion,
  getQuestionsBySubject,
} from '../controllers/question.controller.js';
import { previewDocx, importDocx } from '../controllers/docxUpload.controller.js';
import { protectAdmin } from '../middleware/auth.js';
import { validateQuestion } from '../middleware/validateQuestion.js';
import { uploadDocx } from '../middleware/upload.js';

const router = express.Router();

router.use(protectAdmin);

router.post('/preview-docx', uploadDocx.single('file'), previewDocx);
router.post('/import-docx',  importDocx);

router.get('/by-subject', getQuestionsBySubject);
router.get('/',     getQuestions);
router.get('/:id',  getQuestionById);
router.post('/',    validateQuestion, createQuestion);
router.put('/:id',  validateQuestion, updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;
