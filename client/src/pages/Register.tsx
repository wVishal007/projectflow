import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { PasswordStrength } from '../components/ui/PasswordStrength';
import { useFormValidation, rules } from '../hooks/useFormValidation';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const { getError, validateAll, handleBlur, handleChange } = useFormValidation({
    name: { rules: [rules.required('Name'), rules.minLength(2, 'Name')] },
    email: { rules: [rules.required('Email'), rules.email()] },
    password: { rules: [rules.required('Password'), rules.minLength(8, 'Password')] },
    confirmPassword: {
      rules: [rules.required('Confirmation'), { test: (v) => v === password, message: 'Passwords do not match' }],
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateAll({ name, email, password, confirmPassword })) return;
    try {
      await register(name, email, password);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Get started with ProjectFlow</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4" noValidate>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg" role="alert">
              {error}
            </div>
          )}
          <FormField label="Name" required error={getError('name')} htmlFor="reg-name">
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); handleChange('name', e.target.value); }}
              onBlur={(e) => handleBlur('name', e.target.value)}
              className={`input-field ${getError('name') ? 'input-field-error' : ''}`}
              placeholder="Your name"
              autoComplete="name"
            />
          </FormField>
          <FormField label="Email" required error={getError('email')} htmlFor="reg-email">
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); handleChange('email', e.target.value); }}
              onBlur={(e) => handleBlur('email', e.target.value)}
              className={`input-field ${getError('email') ? 'input-field-error' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </FormField>
          <FormField label="Password" required error={getError('password')} htmlFor="reg-password">
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); handleChange('password', e.target.value); }}
              onBlur={(e) => handleBlur('password', e.target.value)}
              className={`input-field ${getError('password') ? 'input-field-error' : ''}`}
              placeholder="Min 8 characters"
              autoComplete="new-password"
            />
            <PasswordStrength password={password} />
          </FormField>
          <FormField label="Confirm Password" required error={getError('confirmPassword')} htmlFor="reg-confirm">
            <input
              id="reg-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); handleChange('confirmPassword', e.target.value); }}
              onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
              className={`input-field ${getError('confirmPassword') ? 'input-field-error' : ''}`}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
          </FormField>
          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
