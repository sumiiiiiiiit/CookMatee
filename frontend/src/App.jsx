import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import VerifyEmail from './pages/auth/VerifyEmail';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import SavedRecipes from './pages/SavedRecipes';
import AdminDashboard from './pages/AdminDashboard';
import Leaderboard from './pages/Leaderboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Chatbot from './pages/Chatbot';
import Messages from './pages/Messages';
import Earnings from './pages/Earnings';
import PaymentSuccess from './pages/PaymentSuccess';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

function ThemeManager() {
    const location = useLocation();

    // Listen to changes in location or when component mounts
    useEffect(() => {
        const isDark = localStorage.getItem('theme') === 'dark';
        if (location.pathname.startsWith('/admin')) {
            document.documentElement.classList.remove('dark');
        } else {
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [location.pathname]);

    return null;
}

function App() {
    return (
        <Router>
            <ThemeManager />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/home" element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                } />
                <Route path="/about" element={<About />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/recipes/leaderboard" element={<Leaderboard />} />
                <Route path="/chatbot" element={
                    <ProtectedRoute>
                        <Chatbot />
                    </ProtectedRoute>
                } />
                <Route path="/messages" element={
                    <ProtectedRoute>
                        <Messages />
                    </ProtectedRoute>
                } />
                <Route path="/earnings" element={
                    <ProtectedRoute>
                        <Earnings />
                    </ProtectedRoute>
                } />
                <Route path="/recipes/:id" element={<RecipeDetail />} />
                <Route path="/saved-recipes" element={
                    <ProtectedRoute>
                        <SavedRecipes />
                    </ProtectedRoute>
                } />
                <Route path="/admin" element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/payment-success" element={
                    <ProtectedRoute>
                        <PaymentSuccess />
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
