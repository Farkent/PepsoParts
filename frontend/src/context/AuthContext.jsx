import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setCsrfToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get('/admin/me');
      if (res?.data?.admin) {
        setAdmin(res.data.admin);
        if (res.data.csrf_token) {
          setCsrfToken(res.data.csrf_token);
        }
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setAdmin(null);
    };

    window.addEventListener('pepso:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('pepso:unauthorized', handleUnauthorized);
  }, [checkAuth]);

  const login = async (email, password) => {
    const res = await api.post('/admin/login', { email, password });
    if (res?.data?.admin) {
      setAdmin(res.data.admin);
      if (res.data.csrf_token) {
        setCsrfToken(res.data.csrf_token);
      }
      return res.data.admin;
    }
    throw new Error('Login gagal.');
  };

  const logout = async () => {
    try {
      await api.post('/admin/logout');
    } catch {
      // ignore
    } finally {
      setAdmin(null);
      setCsrfToken('');
    }
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, checkAuth, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

