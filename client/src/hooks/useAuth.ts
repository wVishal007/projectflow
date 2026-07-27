import { useState, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { setAuth, getStoredUser, logout as clearAuth, isAuthenticated } from '../lib/auth';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      setAuth(res.data.accessToken, res.data.refreshToken, res.data.user);
      setUser(res.data.user);
      return res.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register({ name, email, password });
      setAuth(res.data.accessToken, res.data.refreshToken, res.data.user);
      setUser(res.data.user);
      return res.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  return { user, loading, error, login, register, logout, isAuthenticated: isAuthenticated() };
}
