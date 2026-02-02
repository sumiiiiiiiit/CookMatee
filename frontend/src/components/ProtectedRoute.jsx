import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '@/lib/api';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {

        const fetchUser = async () => {
            try {
                const response = await authAPI.getProfile();

                setCurrentUser(response.data.user);
            } catch (error) {
                // Token likely invalid or expired
                setCurrentUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#fcfcfd]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && currentUser.role !== 'admin') {
        return <Navigate to="/home" replace />;
    }

    return children;
};

export default ProtectedRoute;
