import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const LOCAL_URI  = 'mongodb://localhost:27017/testseries';
const ATLAS_URI  = process.env.MONGO_URI;
const COLLECTIONS = ['users', 'admins', 'tests', 'questions', 'attempts', 'results'];

async function migrate() {
  console.log('\n🔄  TestSeries — Local → Atlas Migration\n');

  // ── Connect local ──────────────────────────────────────────────
  console.log('📡  Connecting to local MongoDB...');
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('✅  Local connected\n');

  // ── Connect Atlas ──────────────────────────────────────────────
  console.log('📡  Connecting to MongoDB Atlas...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log('✅  Atlas connected\n');

  let totalMigrated = 0;

  for (const name of COLLECTIONS) {
    try {
      const localCol = localConn.collection(name);
      const atlasCol = atlasConn.collection(name);

      const docs = await localCol.find({}).toArray();

      if (docs.length === 0) {
        console.log(`⏭   ${name}: empty — skipped`);
        continue;
      }

      // Drop existing Atlas data for this collection to avoid duplicates
      await atlasCol.deleteMany({});

      const result = await atlasCol.insertMany(docs, { ordered: false });
      console.log(`✅  ${name}: ${result.insertedCount} documents migrated`);
      totalMigrated += result.insertedCount;
    } catch (err) {
      console.error(`❌  ${name}: ${err.message}`);
    }
  }

  console.log(`\n🎉  Migration complete — ${totalMigrated} total documents moved to Atlas`);

  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('\n❌  Migration failed:', err.message);
  process.exit(1);
});
