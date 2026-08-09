import Test from '../models/Test.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';

// GET /api/guest/tests
export const listPublishedTests = async (req, res) => {
  try {
    const tests = await Test.find({ status: 'published' })
      .populate('questionCount')
      .sort({ createdAt: -1 })
      .select('title description duration passingMarks totalMarks questionCount');
    res.json({ success: true, tests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/guest/tests/:id
export const getTestWithQuestions = async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, status: 'published' })
      .populate('questionCount');
    if (!test) return res.status(404).json({ message: 'Test not found' });

    let questions = await Question.find({ testId: test._id })
      .select('question options marks explanation');

    if (test.randomQuestions) questions = questions.sort(() => Math.random() - 0.5);

    // Strip correctAnswer — never send to client during exam
    const sanitized = questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      marks: q.marks,
    }));

    res.json({ success: true, test, questions: sanitized });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/guest/submit
export const submitAttempt = async (req, res) => {
  try {
    const { userName, email, testId, answers, timeTaken } = req.body;
    if (!userName || !email || !testId || !Array.isArray(answers))
      return res.status(400).json({ message: 'userName, email, testId and answers are required' });

    const test = await Test.findOne({ _id: testId, status: 'published' });
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const questions = await Question.find({ testId }).select('correctAnswer marks');
    const qMap = Object.fromEntries(questions.map((q) => [q._id.toString(), q]));

    let score = 0;
    const gradedAnswers = answers.map(({ questionId, selectedOption }) => {
      const q = qMap[questionId];
      if (!q) return { questionId, selectedOption: -1, isCorrect: false, marksAwarded: 0 };
      const isCorrect = selectedOption === q.correctAnswer;
      const marksAwarded = isCorrect ? q.marks : 0;
      score += marksAwarded;
      return { questionId, selectedOption: selectedOption ?? -1, isCorrect, marksAwarded };
    });

    const percentage = test.totalMarks > 0 ? Math.round((score / test.totalMarks) * 100) : 0;
    const passed = score >= test.passingMarks;

    const attempt = await Attempt.create({
      userName: userName.trim(),
      email: email.trim().toLowerCase(),
      testId,
      answers: gradedAnswers,
      score,
      percentage,
      passed,
      timeTaken: timeTaken || 0,
    });

    // Return full questions with correctAnswer for result display
    const fullQuestions = await Question.find({ testId }).select('question options correctAnswer explanation marks');

    res.status(201).json({
      success: true,
      result: {
        _id: attempt._id,
        userName: attempt.userName,
        score,
        percentage,
        passed,
        timeTaken: attempt.timeTaken,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        answers: gradedAnswers,
        questions: fullQuestions,
        submittedAt: attempt.submittedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
