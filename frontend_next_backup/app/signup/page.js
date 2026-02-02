'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    // Basic client-side validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (!/\d/.test(formData.password)) {
      setError('Password must contain at least one number');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.register(formData);

      // Show success message from backend
      setSuccessMessage(
        response.message ||
          'Account created! Please check your email to verify your account.'
      );

      // Redirect to login after a short delay so user can read the message
      setTimeout(() => {
        router.push('/login');
      }, 4000);

    } catch (err) {
      const message = err.response?.data?.message;

      if (message?.includes('already exists') && message?.includes('resent')) {
        // Special case: user exists but not verified → email was resent
        setSuccessMessage('Verification email resent. Please check your inbox.');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-white rounded-lg shadow-md flex items-center justify-center">
            <div className="w-16 h-16 bg-amber-900 rounded-full flex items-center justify-center">
              <span className="text-white text-3xl">🍴</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center text-gray-700 text-xl font-semibold mb-2">
          Create your CookMate account
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Join thousands of food lovers sharing and discovering recipes!
        </p>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm border border-green-200">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="input-field"
              required
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="input-field"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                className="input-field pr-12"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed transition-all ${
              loading ? 'animate-pulse' : ''
            }`}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
            >
              Log in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}