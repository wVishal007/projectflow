import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Analytics } from './pages/Analytics';
import { Audits } from './pages/Audits';
import { AuditDetail } from './pages/AuditDetail';
import { authApi } from './api/auth.api';
import { isAuthenticated, getStoredUser, setAuth, clearAuth } from './lib/auth';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ user: User; accessToken: string; refreshToken: string }>;
  register: (name: string, email: string, password: string) => Promise<{ user: User; accessToken: string; refreshToken: string }>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { throw new Error('AuthProvider not initialized'); },
  register: async () => { throw new Error('AuthProvider not initialized'); },
  logout: () => {},
  loading: false,
  error: null,
});

export function useAuthContext() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  if (!isAuthenticated() || !user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  if (isAuthenticated() && user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function ThemeInit() {
  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem('pf-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const listener = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('pf-theme')) {
        root.classList.toggle('dark', e.matches);
      }
    };
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);
  return null;
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center animate-scaleIn">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <p className="text-xl text-gray-900 dark:text-gray-100 mb-2">Page not found</p>
        <p className="text-gray-500 dark:text-gray-400 mb-6">The page you are looking for does not exist.</p>
        <a href="/dashboard" className="btn-primary inline-block">Back to Dashboard</a>
      </div>
    </div>
  );
}

function RouterGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user } = useAuthContext();

  if (location.pathname.startsWith('/login') || location.pathname.startsWith('/register')) {
    if (isAuthenticated() && user) return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
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
      setError(err?.message || 'Login failed');
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
      setError(err?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      <ThemeInit />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="audits" element={<Audits />} />
          <Route path="audits/:id" element={<AuditDetail />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthContext.Provider>
  );
}
