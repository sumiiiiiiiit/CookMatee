'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('Verifying your email...');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('No verification token found in the link.');
      setStatus('');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/auth/verify-email?token=${token}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Verification failed');
        }

        setStatus('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } catch (err) {
        setError(err.message || 'Something went wrong during verification');
        setStatus('');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="card max-w-md w-full p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center">
            <span className="text-4xl">🍴</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {status}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {!error && status.includes('success') && (
          <p className="text-green-600 mt-4">
            You can close this tab or wait for redirect...
          </p>
        )}

        {!error && !status && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}