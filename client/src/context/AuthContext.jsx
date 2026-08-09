/* eslint-disable react-refresh/only-export-components, react/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null); // student
  const [admin, setAdmin]   = useState(null); // admin
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const adminToken = localStorage.getItem('adminToken');
      const userToken  = localStorage.getItem('token');
      try {
        if (adminToken) {
          const { data } = await api.get('/admin/auth/me');
          setAdmin(data.admin);
        } else if (userToken) {
          const { data } = await api.get('/auth/me');
          setUser(data);
        }
      } catch (err) {
        // Only clear token if server explicitly rejected it (401)
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loginAdmin = async (credentials) => {
    const { data } = await api.post('/admin/auth/login', credentials);
    localStorage.setItem('adminToken', data.token);
    setAdmin(data.admin);
    return data.admin;
  };

  const logoutAdmin = async () => {
    try {
      await api.post('/admin/auth/logout', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
    } catch { /* ignore */ }
    localStorage.removeItem('adminToken');
    setAdmin(null);
  };

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, admin, loading, login, register, logout, loginAdmin, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
