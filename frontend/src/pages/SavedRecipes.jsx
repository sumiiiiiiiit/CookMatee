import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, recipeAPI, getImageUrl } from 'lib/api';
import Cookies from 'js-cookie';
import Navbar from '../components/Navbar';

export default function SavedRecipes() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profileRes = await authAPI.getProfile();
                const userData = profileRes.data.user || profileRes.data;
                setUser(userData);

                const savedRes = await recipeAPI.getSaved();
                // Check multiple potential keys for backwards compatibility or variations
                const recipesToShow = savedRes.data.savedRecipes || savedRes.data.recipes || [];
                setSavedRecipes(recipesToShow);
            } catch (error) {
                console.error('Error fetching saved recipes:', error);
                if (error.response?.status === 401) {
                    Cookies.remove('token');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const handleRemove = async (id) => {
        try {
            await recipeAPI.save(id);
            setSavedRecipes(savedRecipes.filter(r => r._id !== id));
        } catch (error) {
            console.error('Error removing recipe:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
            <Navbar activePage="recipes" user={user} />

            <main className="flex-grow p-10 md:p-20">
                <h2 className="text-4xl font-extrabold text-[#1a2e1a] mb-12">My Cookbook (Saved)</h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-white rounded-2xl animate-pulse shadow-sm"></div>
                        ))}
                    </div>
                ) : savedRecipes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {savedRecipes.map((recipe) => (
                            <div
                                key={recipe._id}
                                onClick={() => navigate(`/recipes/${recipe._id}`)}
                                className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex items-center space-x-6 hover:shadow-xl transition-all cursor-pointer group"
                            >
                                <div className="w-32 h-32 bg-[#f3f4f6] rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform">
                                    {recipe.image ? (
                                        <img src={getImageUrl(recipe.image)} alt={recipe.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors">{recipe.title}</h3>
                                    <p className="text-xs text-gray-400 mb-6 font-medium">Saved on {new Date(recipe.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/recipes/${recipe._id}`); }}
                                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs transition-all flex items-center shadow-md shadow-indigo-100 hover:scale-105"
                                        >
                                            Cook Now
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemove(recipe._id); }}
                                            className="px-6 py-2.5 bg-white hover:bg-red-50 text-red-500 border border-red-100 rounded-xl font-bold text-xs transition-all"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18.477 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">No recipes saved yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Browse the recipe catalog and save your favorites to build your personal cookbook!</p>
                        <button
                            onClick={() => navigate('/recipes')}
                            className="mt-8 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:scale-105 transition-transform"
                        >
                            Explore Recipes
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
