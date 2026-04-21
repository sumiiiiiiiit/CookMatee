import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from 'lib/api';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authAPI.getProfile()
      .then((res) => setCurrentUser(res.data.user || res.data))
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#fcfcfd]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && currentUser.role !== 'admin') return <Navigate to="/home" replace />;

  return children;
}
