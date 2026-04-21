import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from 'lib/api';
import logo from '../../assets/logo.png';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await authAPI.forgotPassword({ email });
            if (response.data.success) {
                setMessage('A password reset link has been sent to your email.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
            <div className="card max-w-md w-full p-10 bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm">
                <div className="flex justify-center mb-8">
                    <img src={logo} alt="CookMate Logo" className="w-24 h-auto" />
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">Forgot Password?</h2>
                    <p className="text-gray-500 font-medium">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {message && (
                    <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-6 text-sm border border-emerald-100 font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-sm border border-red-100 font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2 uppercase tracking-wider text-xs ml-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="username@example.com"
                            className="w-full px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white dark:bg-[#1a1a1a] outline-none transition-all font-medium text-gray-900 dark:text-gray-100"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || message}
                        className="w-full py-4 bg-primary hover:bg-secondary text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:transform-none"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Sending Link...</span>
                            </div>
                        ) : 'Send Reset Link'}
                    </button>

                    <div className="text-center pt-2">
                        <Link to="/login" className="text-primary hover:text-secondary font-bold text-sm transition-colors flex items-center justify-center gap-2 group">
                            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            Back to Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
