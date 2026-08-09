import Test from '../models/Test.js';
import Question from '../models/Question.js';

// GET /api/tests — list published tests
export const listPublishedTests = async (req, res) => {
  try {
    const tests = await Test.find({ status: 'published' })
      .populate('questionCount')
      .sort({ createdAt: -1 });
    res.json({ success: true, tests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tests/:id — get test + questions (correctAnswer stripped)
export const getTestWithQuestions = async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, status: 'published' });
    if (!test) return res.status(404).json({ message: 'Test not found' });

    let questions = await Question.find({ testId: test._id })
      .select('-correctAnswer -explanation');

    if (test.randomQuestions) questions = questions.sort(() => Math.random() - 0.5);
    if (test.randomOptions) {
      questions = questions.map((q) => {
        const opts = [...q.options];
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
        return { ...q.toObject(), options: opts };
      });
    }

    res.json({ success: true, test, questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
