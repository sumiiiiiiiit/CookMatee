import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { authAPI } from 'lib/api';

export default function Messages() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authAPI.getProfile();
                setUser(response.data.user || response.data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
            <Navbar activePage="messages" user={user} />

            <main className="flex-grow flex items-center justify-center p-10">
                <div className="text-center bg-white p-16 rounded-[40px] shadow-xl max-w-2xl border border-gray-100">
                    <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-6 uppercase tracking-tight">Direct Messaging</h1>
                    <p className="text-lg text-gray-500 leading-relaxed mb-10">
                        This feature allows you to contact the chef directly for private consultations and personalized recipe tips.
                        It's part of our premium experience.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => window.history.back()}
                            className="btn-dark px-10 py-4 !w-auto"
                        >
                            Go Back
                        </button>
                        <div className="px-10 py-4 bg-gray-100 text-gray-400 font-bold rounded-2xl cursor-not-allowed border border-gray-200">
                            Coming Soon
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
