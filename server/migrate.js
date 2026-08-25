import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const questionSchema = new mongoose.Schema({}, { strict: false });
const Question = mongoose.model('Question', questionSchema);

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const questions = await Question.find({ testId: { $exists: true } });
    let count = 0;

    for (const q of questions) {
      const doc = q.toObject();
      if (doc.testId && !doc.testIds) {
        await Question.updateOne(
          { _id: q._id },
          { 
            $set: { testIds: [doc.testId] },
            $unset: { testId: "" }
          }
        );
        count++;
      } else if (!doc.testIds) {
        await Question.updateOne(
          { _id: q._id },
          { 
            $set: { testIds: [] },
            $unset: { testId: "" }
          }
        );
        count++;
      }
    }

    console.log(`Migrated ${count} questions.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
