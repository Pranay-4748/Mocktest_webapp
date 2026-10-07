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

    let questions = await Question.find({ testIds: test._id })
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

// GET /api/tests/generate — Generate dynamic topic test
export const generateTopicTest = async (req, res) => {
  try {
    const { topic, difficulty, limit = 20 } = req.query;
    
    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const filter = { topic: { $regex: new RegExp(`^${topic}$`, 'i') } };
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    // Fetch random questions matching the topic
    let questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: Number(limit) } },
      { $project: { correctAnswer: 0, explanation: 0 } } // Exclude answers
    ]);

    if (!questions.length) {
      return res.status(404).json({ message: 'No questions found for this topic/difficulty' });
    }

    // Mock a test object for the frontend to render properly
    const test = {
      _id: 'practice-mode',
      title: `${topic} Practice Test (${difficulty || 'Mixed'})`,
      description: 'Dynamically generated practice test based on your selection.',
      duration: questions.length * 1, // 1 minute per question default
      passingMarks: Math.ceil(questions.length * 0.4), // 40% to pass
      totalMarks: questions.length,
      isPractice: true,
      topic,
      difficulty,
    };

    res.json({ success: true, test, questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
