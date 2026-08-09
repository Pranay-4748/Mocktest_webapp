# TestSeries — MCQ Mock Test Web App

## Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + React Router v6 + Axios
- **Backend**: Node.js + Express + MongoDB (Mongoose) + JWT + Multer

## Project Structure
```
testseries-webapp/
├── client/                  # React frontend
│   └── src/
│       ├── api/             # Axios instance
│       ├── components/
│       │   ├── common/      # Spinner, Button, etc.
│       │   └── layout/      # Navbar, Sidebar
│       ├── context/         # AuthContext
│       ├── hooks/           # useApi
│       ├── pages/
│       │   ├── auth/        # Login, Register
│       │   ├── student/     # Dashboard, Tests, Results
│       │   └── admin/       # Admin Dashboard, Manage Tests/Questions/Users
│       └── routes/          # ProtectedRoute
└── server/                  # Express backend
    ├── config/              # DB connection
    ├── controllers/         # Route handlers
    ├── middleware/          # auth.js, upload.js
    ├── models/              # User, Test, Question, Result
    ├── routes/              # API routes
    ├── uploads/             # Multer file storage
    └── utils/               # JWT helpers
```

## Setup

### Backend
```bash
cd server
npm install
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## API Endpoints (planned)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/tests | List published tests |
| POST | /api/tests | Create test (admin) |
| GET | /api/tests/:id | Get test details |
| POST | /api/results/submit | Submit test answers |
| GET | /api/results/my | Get my results |
