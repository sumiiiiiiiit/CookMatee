import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';
import Navbar from '../components/Navbar';
import logo from '../assets/logo.png';
import UploadRecipeModal from '../components/UploadRecipeModal';

export default function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authAPI.getProfile();
                setUser(response.data.user || response.data);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
            <Navbar activePage="home" />

            {/* Hero Section */}
            <main className="flex-grow flex flex-col items-center justify-center text-center px-4 -mt-20">
                <h1 className="text-6xl md:text-7xl font-extrabold text-[#1a1a1a] mb-8 leading-tight">
                    Discover, Cook & <br /> Share Amazing <br /> Recipes
                </h1>

                <div className="flex space-x-4">
                    <button
                        onClick={() => navigate('/recipes')}
                        className="bg-primary hover:bg-secondary text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:scale-105"
                    >
                        Explore Recipes
                    </button>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-white hover:bg-gray-50 text-primary border-2 border-primary px-10 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-gray-100 transition-all transform hover:scale-105"
                    >
                        Upload Recipe
                    </button>
                </div>
            </main>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <UploadRecipeModal
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={() => {
                        alert('Recipe uploaded successfully!');
                        navigate('/recipes');
                    }}
                />
            )}
        </div>
    );
}
