import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({ baseURL: BASE });

// Send the right token based on the route
api.interceptors.request.use((config) => {
  const isAdminRoute = config.url?.startsWith('/admin');
  const token = isAdminRoute
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-redirect on 401/403 — but never for the session-restore calls
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthInit = url.includes('/auth/me');
    if (!isAuthInit && (err.response?.status === 401 || err.response?.status === 403)) {
      const isAdmin = !!localStorage.getItem('adminToken');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('token');
      window.location.href = isAdmin ? '/admin/login' : '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
