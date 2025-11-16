import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/auth';
import type { LoginCredentials } from '@/types';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, error, clearError } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginCredentials) => {
    setIsSubmitting(true);
    clearError();

    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
            <span className="text-3xl font-bold text-primary">G</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Garotan Management System
          </h1>
          <p className="text-gray-100">Sign in to your account</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
                placeholder="admin@garotan.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`input w-full ${errors.password ? 'border-red-500' : ''}`}
                placeholder="••••••••"
                {...register('password', {
                  required: 'Password is required',
                })}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn btn-primary py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="text-center">
                <strong>Admin:</strong> admin@garotan.com / Password123!
              </p>
              <p className="text-center">
                <strong>Manager:</strong> manager@garotan.com / Password123!
              </p>
              <p className="text-center">
                <strong>Cashier:</strong> cashier@garotan.com / Password123!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-100">
          &copy; 2025 Garotan Premium Meats & Produce. All rights reserved.
        </p>
      </div>
    </div>
  );
}
