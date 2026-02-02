import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import logo from '../assets/logo.png';

export default function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
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

            // Redirect to OTP verification page
            navigate('/verify-email', { state: { email: formData.email } });

        } catch (err) {
            const message = err.response?.data?.message;

            if (message?.includes('already exists') && message?.includes('resent')) {
                // Redirect to OTP page
                navigate('/verify-email', { state: { email: formData.email } });
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
                <div className="flex justify-center mb-6">
                    <img src={logo} alt="CookMate Logo" className="w-24 h-auto" />
                </div>

                <h2 className="text-center text-gray-700 text-xl font-semibold mb-2">
                    Create your CookMate account
                </h2>
                <p className="text-center text-gray-500 text-sm mb-8">
                    Join thousands of food lovers sharing and discovering recipes!
                </p>

                {successMessage && (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm border border-green-200">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
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

                    <div>
                        <label className="block text-gray-700 font-medium mb-3 text-sm">Register as:</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.role === 'user' ? 'border-primary bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-white text-gray-500'
                                }`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="user"
                                    checked={formData.role === 'user'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                <span className="font-semibold">User</span>
                            </label>
                            <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.role === 'admin' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-100 bg-white text-gray-500'
                                }`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={formData.role === 'admin'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                <span className="font-semibold">Admin</span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed transition-all ${loading ? 'animate-pulse' : ''
                            }`}
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        Already have an account?{' '}
                        <Link
                            to="/login"
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
