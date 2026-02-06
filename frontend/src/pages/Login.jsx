import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { authAPI } from 'lib/api';
import logo from '../assets/logo.png';

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = Cookies.get('token');
        if (token) {
            navigate('/home');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(formData);

            if (response.data.token) {
                Cookies.set('token', response.data.token, { expires: 7 });
                navigate('/home');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
            <div className="card max-w-md w-full p-8 bg-white rounded-2xl shadow-lg">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <img src={logo} alt="CookMate Logo" className="w-24 h-auto" />
                </div>

                {/* Title */}
                <h2 className="text-center text-gray-700 mb-6 text-xl font-medium">
                    Enter your details to sign in to your account.
                </h2>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm border border-red-100">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="e.g. username@example.com"
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="enter your password"
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Forgot Password */}
                    <div className="text-left">
                        <Link to="#" className="text-primary text-sm hover:underline">
                            Forgot Password?
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Continue'}
                    </button>

                    {/* Sign Up Link */}
                    <p className="text-center text-sm text-gray-600 mt-6">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary hover:underline font-semibold">
                            Register Now
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
