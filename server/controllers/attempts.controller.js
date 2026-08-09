import Attempt from '../models/Attempt.js';
import Test    from '../models/Test.js';

// GET /api/admin/attempts?search=&page=&limit=
export const getAttempts = async (req, res) => {
  try {
    const { search, page = 1, limit = 15 } = req.query;

    // Only show attempts for this admin's tests
    const adminTests = await Test.find({ createdBy: req.admin._id }).select('_id');
    const testIds = adminTests.map((t) => t._id);

    const filter = { testId: { $in: testIds } };
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [attempts, total] = await Promise.all([
      Attempt.find(filter)
        .populate('testId', 'title totalMarks')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Attempt.countDocuments(filter),
    ]);

    res.json({
      success: true,
      attempts,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
