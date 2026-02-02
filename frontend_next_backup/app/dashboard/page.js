'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = Cookies.get('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await authAPI.getProfile();
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        Cookies.remove('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-amber-900 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🍴</span>
              </div>
              <span className="text-xl font-bold text-gray-800">COOKMATE</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <button className="text-gray-700 hover:text-primary transition">Home</button>
              <button className="text-gray-700 hover:text-primary transition">Recipes</button>
              <button className="text-gray-700 hover:text-primary transition">Chatbot</button>
              <button className="text-gray-700 hover:text-primary transition">About us</button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to CookMate! 👋</h1>
          
          {user && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-lg text-white">
                <h2 className="text-2xl font-semibold mb-2">Hello, {user.name}!</h2>
                <p className="opacity-90">{user.email}</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Profile</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-semibold">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                    <span className="font-semibold">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              
                
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}