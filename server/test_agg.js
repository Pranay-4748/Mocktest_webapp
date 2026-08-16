import mongoose from 'mongoose';
import Question from './models/Question.js';
import Test from './models/Test.js';
import Admin from './models/Admin.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admins = await Admin.find();
    console.log(`Found ${admins.length} admins.`);

    for (const admin of admins) {
      console.log(`\nTesting for admin: ${admin.email} (${admin._id})`);
      const req = { admin, query: {} };

      const adminTests = await Test.find({ createdBy: req.admin._id }).select('_id title');
      const testIds = adminTests.map((t) => t._id);
      const testMap = {};
      adminTests.forEach((t) => { testMap[String(t._id)] = t.title; });

      const matchStage = testIds.length ? {
        $or: [
          { testId: { $in: testIds } },
          { createdBy: req.admin._id, testId: { $exists: false } },
          { createdBy: req.admin._id, testId: null },
        ],
      } : {
        $or: [
          { createdBy: req.admin._id, testId: { $exists: false } },
          { createdBy: req.admin._id, testId: null },
        ],
      };

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

      console.log(`Success for admin ${admin.email}. Groups found: ${groups.length}`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
