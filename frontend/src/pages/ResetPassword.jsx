import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authAPI } from 'lib/api';
import logo from '../assets/logo.png';

export default function ResetPassword() {
    const navigate = useNavigate();
    const { token } = useParams();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [status, setStatus] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', text: '' });

        if (formData.password !== formData.confirmPassword) {
            return setStatus({ type: 'error', text: 'Passwords do not match.' });
        }

        if (formData.password.length < 8) {
            return setStatus({ type: 'error', text: 'Password must be at least 8 characters long.' });
        }

        setLoading(true);

        try {
            const response = await authAPI.resetPassword({
                token,
                password: formData.password
            });
            if (response.data.success) {
                setStatus({ type: 'success', text: 'Password reset successful! Redirecting to login...' });
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (err) {
            setStatus({ type: 'error', text: err.response?.data?.message || 'Failed to reset password. Link may be invalid or expired.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center px-4">
            <div className="card max-w-md w-full p-10 bg-white rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <img src={logo} alt="CookMate Logo" className="w-24 h-auto" />
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Reset Password</h2>
                    <p className="text-gray-500 font-medium">Create a strong new password for your account.</p>
                </div>

                {/* Status Messages */}
                {status.text && (
                    <div className={`p-4 rounded-2xl mb-6 text-sm border font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'success'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-red-50 text-red-500 border-red-100'
                        }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {status.type === 'success' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                        </svg>
                        {status.text}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wider text-xs ml-1">New Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Create a new password"
                            className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all font-medium text-gray-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-bold mb-2 uppercase tracking-wider text-xs ml-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Re-enter your new password"
                            className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all font-medium text-gray-900"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || status.type === 'success'}
                        className="w-full py-4 bg-primary hover:bg-secondary text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:transform-none"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Saving Password...</span>
                            </div>
                        ) : 'Update Password'}
                    </button>

                    {/* Back to Login */}
                    <div className="text-center pt-2">
                        <Link to="/login" className="text-gray-400 hover:text-primary font-bold text-sm transition-colors">
                            Return to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
