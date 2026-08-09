import Attempt from '../models/Attempt.js';
import Test from '../models/Test.js';
import Question from '../models/Question.js';

// POST /api/results/submit
export const submitTest = async (req, res) => {
  try {
    const { testId, answers, timeTaken } = req.body; // answers: [{ questionId, selectedOption }]
    const user = req.user;

    const test = await Test.findOne({ _id: testId, status: 'published' });
    if (!test) return res.status(404).json({ message: 'Test not found' });

    // Count how many times this user has attempted this test before
    const priorCount = await Attempt.countDocuments({ email: user.email, testId });
    const attemptNumber = priorCount + 1;

    const questions = await Question.find({ testId });

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
      testId,
      answers: gradedAnswers,
      score,
      percentage: Math.round(percentage * 100) / 100,
      passed,
      timeTaken: timeTaken || 0,
      attemptNumber,
    });

    res.status(201).json({ success: true, attemptId: attempt._id, score, percentage, passed, attemptNumber });
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
    const questions = await Question.find({ testId: attempt.testId._id });
    const qMap = Object.fromEntries(questions.map((q) => [String(q._id), q]));

    const detailed = attempt.answers.map((a) => ({
      ...a,
      question: qMap[String(a.questionId)],
    }));

    res.json({ success: true, attempt: { ...attempt.toObject(), answers: detailed } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
