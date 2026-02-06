import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authAPI, recipeAPI, getImageUrl } from 'lib/api';
import Navbar from '../components/Navbar';

export default function Recipes() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            const token = Cookies.get('token');
            if (token) {
                try {
                    const response = await authAPI.getProfile();
                    setUser(response.data.user || response.data);
                } catch (error) {
                    console.error('Failed to fetch profile:', error);
                    // Optionally handle token expiration or invalid token here
                    Cookies.remove('token');
                    setUser(null);
                }
            }

            try {
                const response = await recipeAPI.getAll();
                setRecipes(response.data.recipes);
            } catch (error) {
                console.error('Failed to fetch recipes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const filteredRecipes = selectedCategory === 'All'
        ? recipes
        : recipes.filter(r => r.category === selectedCategory);

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
            <Navbar activePage="recipes" user={user} />


            <div className="flex-grow flex p-8 gap-8 bg-[#f5f6ff]">
                {/* Sidebar */}
                <aside className="w-64 flex flex-col gap-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Filters</h2>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 text-base">Category</h3>
                        <div className="space-y-3">
                            {['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert'].map(cat => (
                                <label key={cat} className="flex items-center space-x-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={selectedCategory === cat}
                                        onChange={() => setSelectedCategory(cat)}
                                        className="w-4 h-4 border-gray-300 text-primary focus:ring-primary transition"
                                    />
                                    <span className={`text-sm ${selectedCategory === cat ? 'text-primary font-bold' : 'text-gray-600'} group-hover:text-gray-900 transition`}>{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>


                    <button
                        onClick={() => navigate('/saved-recipes')}
                        className="w-full py-4 px-6 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition shadow-sm text-left flex items-center justify-between"
                    >
                        <span>Saved Recipes</span>
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    </button>
                    <button
                        onClick={() => navigate('/recipes/leaderboard')}
                        className="w-full py-4 px-6 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition shadow-sm text-left flex items-center justify-between"
                    >
                        <span>Leaderboard</span>
                        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </button>
                </aside>

                {/* Recipe Grid Area */}
                <main className="flex-grow">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Category: {selectedCategory === 'All' ? 'Latest Recipes' : selectedCategory}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRecipes.length > 0 ? filteredRecipes.map((recipe) => (
                                <div
                                    key={recipe._id}
                                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition hover:shadow-md"
                                >
                                    {/* Image Placeholder or Actual Image */}
                                    <div className="h-48 bg-[#f3f4f6] flex items-center justify-center relative overflow-hidden">
                                        {recipe.image ? (
                                            <img src={getImageUrl(recipe.image)} alt={recipe.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-primary uppercase border border-primary/20">
                                                {recipe.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className={`p-5 ${recipe.isPremium && !(user?._id === (recipe.user?._id || recipe.user) || user?.purchasedRecipes?.some(id => (id._id || id) === recipe._id)) ? 'bg-amber-50' : ''}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className={`text-lg font-bold line-clamp-1 flex-grow ${recipe.isPremium && !(user?._id === (recipe.user?._id || recipe.user) || user?.purchasedRecipes?.some(id => (id._id || id) === recipe._id)) ? 'text-amber-900' : 'text-gray-800'}`}>
                                                {recipe.title}
                                            </h4>
                                            <div className="flex text-amber-400 text-xs ml-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i}>{i < recipe.difficulty ? '★' : '☆'}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center text-[11px] text-gray-500 mb-4 space-x-4">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {recipe.cookingTime}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                {recipe.user?.name || recipe.chefName}
                                            </span>
                                            {recipe.isPremium && (
                                                <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase text-[8px]">Premium</span>
                                            )}
                                        </div>

                                        {recipe.isPremium && !(user?._id === (recipe.user?._id || recipe.user) || user?.purchasedRecipes?.some(id => (id._id || id) === recipe._id)) ? (
                                            <button
                                                onClick={() => navigate(`/recipes/${recipe._id}`)}
                                                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm transition flex items-center justify-center space-x-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                <span>Unlock</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/recipes/${recipe._id}`)}
                                                className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100 rounded-lg font-medium text-sm transition"
                                            >
                                                View Recipe
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-20 text-center">
                                    <div className="flex justify-center mb-6">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18.477 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">No recipes found</h3>
                                    <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
