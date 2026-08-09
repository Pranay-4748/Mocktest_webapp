import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import User from '../models/User.js';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  // Seed Admin
  const adminExists = await Admin.findOne({ email: 'admin@testseries.com' });
  if (adminExists) {
    console.log('⚠  Admin already exists: admin@testseries.com');
  } else {
    await Admin.create({ name: 'Admin User', email: 'admin@testseries.com', password: 'Admin@123' });
    console.log('✓  Created admin: admin@testseries.com');
  }

  // Seed Student
  const studentExists = await User.findOne({ email: 'student@testseries.com' });
  if (studentExists) {
    console.log('⚠  Student already exists: student@testseries.com');
  } else {
    await User.create({ name: 'Student User', email: 'student@testseries.com', password: 'Student@123', role: 'student' });
    console.log('✓  Created student: student@testseries.com');
  }

  console.log('\nCredentials:');
  console.log('  Admin   → admin@testseries.com   / Admin@123');
  console.log('  Student → student@testseries.com / Student@123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
