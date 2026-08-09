import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';

export const AdminRoute = () => {
  const { admin, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
};
