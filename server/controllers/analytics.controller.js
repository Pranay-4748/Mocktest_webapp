import mongoose from 'mongoose';
import Attempt  from '../models/Attempt.js';
import Question from '../models/Question.js';
import Test     from '../models/Test.js';

// GET /api/admin/analytics?testId=
export const getAnalytics = async (req, res) => {
  try {
    const { testId } = req.query;

    // Resolve which testIds belong to this admin
    const adminTests = await Test.find({ createdBy: req.admin._id }).select('_id title');
    const adminTestIds = adminTests.map((t) => t._id);

    if (!adminTestIds.length)
      return res.json({ success: true, data: null, message: 'No tests found' });

    // Scope filter
    const scopeIds = testId
      ? adminTestIds.filter((id) => id.toString() === testId)
      : adminTestIds;

    if (!scopeIds.length)
      return res.status(403).json({ message: 'Test not found or access denied' });

    // ── 1. Score stats ──────────────────────────────────────────
    const [scoreStats] = await Attempt.aggregate([
      { $match: { testId: { $in: scopeIds } } },
      {
        $group: {
          _id: null,
          avgScore:    { $avg: '$percentage' },
          highScore:   { $max: '$percentage' },
          lowScore:    { $min: '$percentage' },
          totalAttempts: { $sum: 1 },
          passed:      { $sum: { $cond: ['$passed', 1, 0] } },
          avgTime:     { $avg: '$timeTaken' },
        },
      },
    ]);

    // ── 2. Score distribution (buckets: 0-20, 20-40, …, 80-100) ─
    const scoreDist = await Attempt.aggregate([
      { $match: { testId: { $in: scopeIds } } },
      {
        $bucket: {
          groupBy: '$percentage',
          boundaries: [0, 20, 40, 60, 80, 101],
          default: 'other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const distLabels = ['0–20', '20–40', '40–60', '60–80', '80–100'];
    const scoreDistFormatted = distLabels.map((label, i) => ({
      range: label,
      count: scoreDist.find((b) => b._id === [0, 20, 40, 60, 80][i])?.count ?? 0,
    }));

    // ── 3. Pass / Fail ratio ────────────────────────────────────
    const passFailData = [
      { name: 'Passed', value: scoreStats?.passed ?? 0 },
      { name: 'Failed', value: (scoreStats?.totalAttempts ?? 0) - (scoreStats?.passed ?? 0) },
    ];

    // ── 4. Most incorrect questions ─────────────────────────────
    const incorrectAgg = await Attempt.aggregate([
      { $match: { testId: { $in: scopeIds } } },
      { $unwind: '$answers' },
      { $match: { 'answers.isCorrect': false, 'answers.selectedOption': { $ne: -1 } } },
      {
        $group: {
          _id: '$answers.questionId',
          wrongCount: { $sum: 1 },
        },
      },
      { $sort: { wrongCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'questions',
          localField: '_id',
          foreignField: '_id',
          as: 'q',
        },
      },
      { $unwind: '$q' },
      {
        $project: {
          wrongCount: 1,
          question: '$q.question',
          subject:  '$q.subject',
          difficulty: '$q.difficulty',
        },
      },
    ]);

    // ── 5. Subject-wise analysis ────────────────────────────────
    const subjectAgg = await Attempt.aggregate([
      { $match: { testId: { $in: scopeIds } } },
      { $unwind: '$answers' },
      {
        $lookup: {
          from: 'questions',
          localField: 'answers.questionId',
          foreignField: '_id',
          as: 'q',
        },
      },
      { $unwind: '$q' },
      { $match: { 'q.subject': { $ne: '' } } },
      {
        $group: {
          _id: '$q.subject',
          total:   { $sum: 1 },
          correct: { $sum: { $cond: ['$answers.isCorrect', 1, 0] } },
        },
      },
      {
        $project: {
          subject: '$_id',
          total: 1,
          correct: 1,
          wrong: { $subtract: ['$total', '$correct'] },
          accuracy: {
            $round: [{ $multiply: [{ $divide: ['$correct', '$total'] }, 100] }, 1],
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // ── 6. Difficulty-wise analysis ─────────────────────────────
    const difficultyAgg = await Attempt.aggregate([
      { $match: { testId: { $in: scopeIds } } },
      { $unwind: '$answers' },
      {
        $lookup: {
          from: 'questions',
          localField: 'answers.questionId',
          foreignField: '_id',
          as: 'q',
        },
      },
      { $unwind: '$q' },
      {
        $group: {
          _id: '$q.difficulty',
          total:   { $sum: 1 },
          correct: { $sum: { $cond: ['$answers.isCorrect', 1, 0] } },
        },
      },
      {
        $project: {
          difficulty: '$_id',
          total: 1,
          correct: 1,
          wrong: { $subtract: ['$total', '$correct'] },
          accuracy: {
            $round: [{ $multiply: [{ $divide: ['$correct', '$total'] }, 100] }, 1],
          },
        },
      },
    ]);

    // ── 7. Attempts over time (last 30 days) ────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const attemptsOverTime = await Attempt.aggregate([
      { $match: { testId: { $in: scopeIds }, submittedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
          count: { $sum: 1 },
          avgPct: { $avg: '$percentage' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, avgPct: { $round: ['$avgPct', 1] }, _id: 0 } },
    ]);

    res.json({
      success: true,
      data: {
        overview: scoreStats
          ? {
              avgScore:      Math.round(scoreStats.avgScore * 10) / 10,
              highScore:     scoreStats.highScore,
              lowScore:      scoreStats.lowScore,
              totalAttempts: scoreStats.totalAttempts,
              passRate:      scoreStats.totalAttempts
                ? Math.round((scoreStats.passed / scoreStats.totalAttempts) * 100)
                : 0,
              avgTime: Math.round(scoreStats.avgTime),
            }
          : null,
        scoreDistribution: scoreDistFormatted,
        passFailData,
        mostIncorrect:  incorrectAgg,
        subjectAnalysis: subjectAgg,
        difficultyAnalysis: difficultyAgg,
        attemptsOverTime,
        tests: adminTests,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
