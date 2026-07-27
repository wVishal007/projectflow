import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { useFormValidation, rules } from '../hooks/useFormValidation';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const { getError, validateAll, handleBlur, handleChange } = useFormValidation({
    email: { rules: [rules.required('Email'), rules.email()] },
    password: { rules: [rules.required('Password'), rules.minLength(8, 'Password')] },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateAll({ email, password })) return;
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md animate-scaleIn">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">PF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4" noValidate>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg" role="alert">
              {error}
            </div>
          )}
          <FormField label="Email" required error={getError('email')} htmlFor="login-email">
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); handleChange('email', e.target.value); }}
              onBlur={(e) => handleBlur('email', e.target.value)}
              className={`input-field ${getError('email') ? 'input-field-error' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </FormField>
          <FormField label="Password" required error={getError('password')} htmlFor="login-password">
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); handleChange('password', e.target.value); }}
              onBlur={(e) => handleBlur('password', e.target.value)}
              className={`input-field ${getError('password') ? 'input-field-error' : ''}`}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </FormField>
          <Button type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
