import Test from '../models/Test.js';
import Question from '../models/Question.js';

// GET /api/admin/tests
export const getTests = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const filter = { createdBy: req.admin._id };

    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [tests, total] = await Promise.all([
      Test.find(filter)
        .populate('questionCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Test.countDocuments(filter),
    ]);

    // Aggregate distinct subjects for each test in one query
    const testIds = tests.map((t) => t._id);
    const subjectAgg = await Question.aggregate([
      { $match: { testId: { $in: testIds }, subject: { $exists: true, $ne: '' } } },
      { $group: { _id: '$testId', subjects: { $addToSet: '$subject' } } },
    ]);
    const subjectMap = {};
    subjectAgg.forEach((row) => { subjectMap[String(row._id)] = row.subjects.sort(); });

    const testsWithSubjects = tests.map((t) => ({
      ...t.toJSON(),
      subjects: subjectMap[String(t._id)] || [],
    }));

    res.json({
      success: true,
      tests: testsWithSubjects,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/tests/:id
export const getTestById = async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, createdBy: req.admin._id })
      .populate('questionCount');
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json({ success: true, test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/tests
export const createTest = async (req, res) => {
  try {
    const { title, description, duration, passingMarks, totalMarks, randomQuestions, randomOptions, status } = req.body;

    const test = await Test.create({
      title: title.trim(),
      description: description?.trim() || '',
      duration: Number(duration),
      passingMarks: Number(passingMarks),
      totalMarks: Number(totalMarks),
      randomQuestions: Boolean(randomQuestions),
      randomOptions: Boolean(randomOptions),
      status: status || 'draft',
      createdBy: req.admin._id,
    });

    res.status(201).json({ success: true, message: 'Test created successfully', test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/tests/:id
export const updateTest = async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, createdBy: req.admin._id });
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const { title, description, duration, passingMarks, totalMarks, randomQuestions, randomOptions, status } = req.body;

    test.title          = title?.trim() ?? test.title;
    test.description    = description?.trim() ?? test.description;
    test.duration       = duration       !== undefined ? Number(duration)       : test.duration;
    test.passingMarks   = passingMarks   !== undefined ? Number(passingMarks)   : test.passingMarks;
    test.totalMarks     = totalMarks     !== undefined ? Number(totalMarks)     : test.totalMarks;
    test.randomQuestions = randomQuestions !== undefined ? Boolean(randomQuestions) : test.randomQuestions;
    test.randomOptions  = randomOptions  !== undefined ? Boolean(randomOptions)  : test.randomOptions;
    test.status         = status         ?? test.status;

    await test.save();
    res.json({ success: true, message: 'Test updated successfully', test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/tests/:id
export const deleteTest = async (req, res) => {
  try {
    const test = await Test.findOneAndDelete({ _id: req.params.id, createdBy: req.admin._id });
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
