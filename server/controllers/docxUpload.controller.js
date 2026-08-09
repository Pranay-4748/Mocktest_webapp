import mammoth from 'mammoth';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import Question from '../models/Question.js';
import Test from '../models/Test.js';
import { parseWithAI } from '../utils/parseWithAI.js';

const extractText = async (file) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (ext === 'pdf') {
    const data = await pdfParse(file.buffer);
    return data.text;
  }
  // docx
  const { value } = await mammoth.extractRawText({ buffer: file.buffer });
  return value;
};

// POST /api/admin/questions/preview-docx
export const previewDocx = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const testId = req.body.testId || req.query.testId;
    if (testId) {
      const test = await Test.findOne({ _id: testId, createdBy: req.admin._id });
      if (!test) return res.status(404).json({ message: 'Test not found' });
    }

    const rawText = await extractText(req.file);
    const { parsed, errors, extractedVia, note } = await parseWithAI(rawText);

    res.json({
      success: true,
      parsed,
      errors,
      total: parsed.length + errors.length,
      extractedVia,
      note
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/questions/import-docx
export const importDocx = async (req, res) => {
  try {
    const { testId, subject, questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0)
      return res.status(400).json({ message: 'questions[] are required' });

    if (testId) {
      const test = await Test.findOne({ _id: testId, createdBy: req.admin._id });
      if (!test) return res.status(404).json({ message: 'Test not found' });
    }

    const docs = questions.map((q) => ({
      testId: testId || undefined,
      createdBy: req.admin._id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      marks: q.marks || 1,
      subject: subject || q.subject || '',
      difficulty: q.difficulty || 'medium',
    }));

    const inserted = await Question.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, imported: inserted.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
