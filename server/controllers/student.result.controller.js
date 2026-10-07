import Attempt from '../models/Attempt.js';
import Test from '../models/Test.js';
import Question from '../models/Question.js';

// POST /api/results/submit
export const submitTest = async (req, res) => {
  try {
    const { testId, answers, timeTaken, practiceTopic, practiceDifficulty } = req.body; // answers: [{ questionId, selectedOption }]
    const user = req.user;

    let test;
    let priorCount = 0;
    let questions = [];
    let savedTestId = testId;

    if (testId === 'practice-mode') {
      // Dynamic Practice Test
      const qIds = answers.map((a) => a.questionId);
      questions = await Question.find({ _id: { $in: qIds } });
      const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      test = {
        totalMarks,
        passingMarks: Math.ceil(totalMarks * 0.4), // 40% to pass
      };
      savedTestId = undefined;
    } else {
      // Standard Test
      test = await Test.findOne({ _id: testId, status: 'published' });
      if (!test) return res.status(404).json({ message: 'Test not found' });
      priorCount = await Attempt.countDocuments({ email: user.email, testId });
      questions = await Question.find({ testIds: testId });
    }

    let score = 0;
    const gradedAnswers = questions.map((q) => {
      const submitted = answers.find((a) => a.questionId === String(q._id));
      const selected = submitted ? submitted.selectedOption : -1;
      const isCorrect = selected === q.correctAnswer;
      const marksAwarded = isCorrect ? q.marks : 0;
      score += marksAwarded;
      return { questionId: q._id, selectedOption: selected, isCorrect, marksAwarded };
    });

    const percentage = test.totalMarks > 0 ? (score / test.totalMarks) * 100 : 0;
    const passed = score >= test.passingMarks;

    const attempt = await Attempt.create({
      userName: user.name,
      email: user.email,
      testId: savedTestId,
      practiceTopic,
      practiceDifficulty,
      answers: gradedAnswers,
      score,
      percentage: Math.round(percentage * 100) / 100,
      passed,
      timeTaken: timeTaken || 0,
      attemptNumber: priorCount + 1,
    });

    res.status(201).json({ success: true, attemptId: attempt._id, score, percentage, passed, attemptNumber: priorCount + 1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/results/my
export const getMyResults = async (req, res) => {
  try {
    const attempts = await Attempt.find({ email: req.user.email })
      .populate('testId', 'title totalMarks passingMarks duration')
      .sort({ submittedAt: -1 });
    res.json({ success: true, attempts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/results/:id
export const getResultById = async (req, res) => {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.id, email: req.user.email })
      .populate('testId', 'title totalMarks passingMarks duration');
    if (!attempt) return res.status(404).json({ message: 'Result not found' });

    // Attach question details + correct answers for review
    const qIds = attempt.answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: qIds } });
    const qMap = Object.fromEntries(questions.map((q) => [String(q._id), q]));

    const detailed = attempt.answers.map((a) => ({
      ...a.toObject ? a.toObject() : a,
      question: qMap[String(a.questionId)],
    }));

    res.json({ success: true, attempt: { ...attempt.toObject(), answers: detailed } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
