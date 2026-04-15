import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentAPI } from 'lib/api';
import Navbar from '../components/common/Navbar';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [error, setError] = useState('');

    const verify = useCallback(async () => {
        setStatus('verifying');
        setError('');

        const urlSearch = window.location.search;
        let data = searchParams.get('data');
        let recipeIdFromUrl = searchParams.get('id');

        if (!data) {
            const dataMatch = urlSearch.match(/[?&]data=([^&]+)/);
            if (dataMatch) data = dataMatch[1];
        }

        if (!recipeIdFromUrl) {
            const idMatch = urlSearch.match(/[?&]id=([^&?]+)/);
            if (idMatch) recipeIdFromUrl = idMatch[1];
        }

        recipeIdFromUrl = recipeIdFromUrl || localStorage.getItem('esewa_recipeId');

        if (!data) {
            setStatus('error');
            setError('No payment identifier found. Please try unlocking again.');
            return;
        }

        try {
            const response = await paymentAPI.verify({ data, recipeId: recipeIdFromUrl });
            if (response.data.success) {
                setStatus('success');
                localStorage.removeItem('esewa_recipeId');

                const recipeId = recipeIdFromUrl;

                setTimeout(() => {
                    if (recipeId) {
                        const cleanId = recipeId.includes('_') ? recipeId.split('_')[0] : recipeId;
                        navigate(`/recipes/${cleanId}`);
                    } else {
                        navigate('/recipes');
                    }
                }, 3000);
            } else {
                setStatus('error');
                setError(response.data.message || 'Verification failed');
            }
        } catch (err) {
            setStatus('error');
            setError(err.response?.data?.message || 'Verification failed. Try re-verifying.');
        }
    }, [searchParams, navigate]);

    useEffect(() => {
        verify();
    }, [verify]);

    return (
        <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#121212] flex flex-col">
            <Navbar activePage="recipes" />
            <main className="flex-grow flex items-center justify-center p-6">
                <div className="bg-white dark:bg-[#1a1a1a] p-10 rounded-[32px] shadow-xl max-w-md w-full text-center">
                    {status === 'verifying' && (
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-6"></div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Verifying Payment</h2>
                            <p className="text-gray-500">Please wait while we confirm your transaction with eSewa...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Payment Successful!</h2>
                            <p className="text-gray-500 mb-8">Your recipe has been unlocked. Redirecting you now...</p>
                            <button
                                onClick={() => navigate('/recipes')}
                                className="w-full py-4 bg-primary hover:bg-secondary text-white rounded-xl font-bold transition shadow-lg shadow-primary/20"
                            >
                                Go to Recipes
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Payment Failed</h2>
                            <p className="text-red-500 mb-8">{error}</p>
                            <button
                                onClick={verify}
                                className="w-full py-4 bg-primary hover:bg-secondary text-white rounded-xl font-bold transition shadow-lg shadow-primary/20 mb-4"
                            >
                                Re-verify Payment
                            </button>
                            <button
                                onClick={() => navigate('/recipes')}
                                className="w-full py-2 text-gray-500 hover:text-gray-800 dark:text-gray-200 font-bold transition"
                            >
                                Back to Recipes
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
