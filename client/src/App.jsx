import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import AdminLayout from './components/layout/AdminLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';

// Student Pages
import DashboardPage from './pages/student/DashboardPage';
import TestListPage from './pages/student/TestListPage';
import TestPage from './pages/student/TestPage';
import ResultPage from './pages/student/ResultPage';

// Admin Pages
import AdminDashboard     from './pages/admin/AdminDashboard';
import ManageTests        from './pages/admin/ManageTests';
import ManageQuestions    from './pages/admin/ManageQuestions';
import ManageUsers        from './pages/admin/ManageUsers';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import QuestionBank       from './pages/admin/QuestionBank';

export default function App() {
  return (
    <BrowserRouter>
      <DarkModeProvider>
      <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Student Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tests" element={<TestListPage />} />
            <Route path="/tests/:id" element={<TestPage />} />
            <Route path="/results/:id" element={<ResultPage />} />
          </Route>

          {/* Admin Protected */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
              <Route path="/admin/tests" element={<ManageTests />} />
              <Route path="/admin/questions" element={<QuestionBank />} />
              <Route path="/admin/tests/:id/questions" element={<ManageQuestions />} />
              <Route path="/admin/users" element={<ManageUsers />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
      </ToastProvider>
      </DarkModeProvider>
    </BrowserRouter>
  );
}
