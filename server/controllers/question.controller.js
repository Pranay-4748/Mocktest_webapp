import Question from '../models/Question.js';
import Test from '../models/Test.js';

// GET /api/admin/questions?testId=&search=&subject=&difficulty=&page=&limit=
export const getQuestions = async (req, res) => {
  try {
    const { testId, search, subject, difficulty, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Scope to tests owned by this admin
    if (testId) {
      const test = await Test.findOne({ _id: testId, createdBy: req.admin._id });
      if (!test) return res.status(404).json({ message: 'Test not found' });
      filter.testId = testId;
    } else {
      const adminTests = await Test.find({ createdBy: req.admin._id }).select('_id');
      filter.testId = { $in: adminTests.map((t) => t._id) };
    }

    if (search) filter.question = { $regex: search.trim(), $options: 'i' };
    if (subject) filter.subject = { $regex: subject.trim(), $options: 'i' };
    if (difficulty) filter.difficulty = difficulty;

    const skip = (Number(page) - 1) * Number(limit);
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('testId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Question.countDocuments(filter),
    ]);

    res.json({
      success: true,
      questions,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/questions/:id
export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('testId', 'title');
    if (!question) return res.status(404).json({ message: 'Question not found' });

    // Verify ownership via test or createdBy
    if (question.testId) {
      const test = await Test.findOne({ _id: question.testId._id || question.testId, createdBy: req.admin._id });
      if (!test) return res.status(403).json({ message: 'Access denied' });
    } else if (String(question.createdBy) !== String(req.admin._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/questions
export const createQuestion = async (req, res) => {
  try {
    const { testId, question, options, correctAnswer, explanation, marks, subject, difficulty } = req.body;

    if (testId) {
      const test = await Test.findOne({ _id: testId, createdBy: req.admin._id });
      if (!test) return res.status(404).json({ message: 'Test not found' });
    }

    const created = await Question.create({
      testId: testId || undefined,
      createdBy: req.admin._id,
      question: question.trim(),
      options: options.map((o) => o.trim()),
      correctAnswer: Number(correctAnswer),
      explanation: explanation?.trim() || '',
      marks: marks !== undefined ? Number(marks) : 1,
      subject: subject?.trim() || '',
      difficulty: difficulty || 'medium',
    });

    res.status(201).json({ success: true, message: 'Question created', question: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/questions/:id
export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    if (question.testId) {
      const test = await Test.findOne({ _id: question.testId, createdBy: req.admin._id });
      if (!test) return res.status(403).json({ message: 'Access denied' });
    } else if (String(question.createdBy) !== String(req.admin._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { question: qText, options, correctAnswer, explanation, marks, subject, difficulty } = req.body;

    if (qText)          question.question      = qText.trim();
    if (options)        question.options       = options.map((o) => o.trim());
    if (correctAnswer !== undefined) question.correctAnswer = Number(correctAnswer);
    if (explanation !== undefined)   question.explanation   = explanation.trim();
    if (marks !== undefined)         question.marks         = Number(marks);
    if (subject !== undefined)       question.subject       = subject.trim();
    if (difficulty)     question.difficulty    = difficulty;

    await question.save();
    res.json({ success: true, message: 'Question updated', question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/questions/:id
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    if (question.testId) {
      const test = await Test.findOne({ _id: question.testId, createdBy: req.admin._id });
      if (!test) return res.status(403).json({ message: 'Access denied' });
    } else if (String(question.createdBy) !== String(req.admin._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await question.deleteOne();
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/questions/by-subject?difficulty=
export const getQuestionsBySubject = async (req, res) => {
  try {
    const { difficulty } = req.query;

    const adminTests = await Test.find({ createdBy: req.admin._id }).select('_id title');
    const testIds = adminTests.map((t) => t._id);
    const testMap = {};
    adminTests.forEach((t) => { testMap[String(t._id)] = t.title; });

    // If admin has no tests, return empty
    if (!testIds.length) return res.json({ success: true, groups: [] });

    const matchStage = { testId: { $in: testIds } };
    if (difficulty) matchStage.difficulty = difficulty;

    const groups = await Question.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $ifNull: ['$subject', 'Uncategorized'] },
          questions: { $push: '$$ROOT' },
          total:  { $sum: 1 },
          easy:   { $sum: { $cond: [{ $eq: ['$difficulty', 'easy']   }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
          hard:   { $sum: { $cond: [{ $eq: ['$difficulty', 'hard']   }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = groups.map((g) => ({
      subject:   g._id,
      total:     g.total,
      easy:      g.easy,
      medium:    g.medium,
      hard:      g.hard,
      questions: g.questions.map((q) => ({
        ...q,
        testTitle: testMap[String(q.testId)] || '—',
      })),
    }));

    res.json({ success: true, groups: result });
  } catch (err) {
    console.error('getQuestionsBySubject error:', err.message);
    res.status(500).json({ message: err.message });
  }
};
