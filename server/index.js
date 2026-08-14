import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'https://test-mock-webapp.onrender.com'];

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

import authRoutes        from './routes/auth.routes.js';
import adminAuthRoutes   from './routes/admin.auth.routes.js';
import testRoutes        from './routes/test.routes.js';
import questionRoutes    from './routes/question.routes.js';
import subjectRoutes     from './routes/subject.routes.js';
import analyticsRoutes   from './routes/analytics.routes.js';
import attemptsRoutes    from './routes/attempts.routes.js';
import studentTestRoutes from './routes/student.test.routes.js';
import resultRoutes      from './routes/result.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/tests', testRoutes);
app.use('/api/admin/questions', questionRoutes);
app.use('/api/admin/subjects', subjectRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/attempts',  attemptsRoutes);
app.use('/api/tests',   studentTestRoutes);
app.use('/api/results', resultRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// ── Serve React frontend in production ──────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  // All non-API routes → index.html (React Router handles them)
  app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
