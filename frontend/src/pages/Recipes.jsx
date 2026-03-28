import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI, recipeAPI, getImageUrl } from 'lib/api';
import Navbar from '../components/Navbar';
import RecipeSearchBar from '../components/RecipeSearchBar';

const STAR = "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z";

// Shared full-cover card
function RecipeCard({ recipe, navigate, user }) {
    const isOwned = user && (recipe.user?._id || recipe.user) === user?._id;
    const isPurchased = user && (user.purchasedRecipes || []).some(pr => (pr?._id || pr) === recipe._id);
    const showUnlock = recipe.isPremium && !isOwned && !isPurchased;

    return (
        <div
            onClick={() => navigate(`/recipes/${recipe._id}`)}
            className="relative rounded-[2.5rem] overflow-hidden cursor-pointer group shadow-sm hover:shadow-2xl transition-all duration-500 h-80"
        >
            {recipe.image ? (
                <img src={getImageUrl(recipe.image)} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt={recipe.title} />
            ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}
            
            {/* Badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80" />
            
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-10">
                {recipe.isPremium ? (
                    <div className="bg-[#007AFF] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" /></svg>
                        PREMIUM
                    </div>
                ) : (
                    <div className="bg-white/95 text-gray-900 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border border-white/20">
                        FREE
                    </div>
                )}
                <span className="bg-black/30 backdrop-blur-md text-white/90 text-[10px] font-black px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-wider">{recipe.category}</span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-7 z-10 transition-transform duration-500 group-hover:-translate-y-2">
                <h4 className="text-xl font-black text-white leading-tight mb-2 transition-colors">{recipe.title}</h4>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60 font-bold truncate max-w-[140px]">By {recipe.chefName}</span>
                    <div className="flex text-amber-400 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-3.5 h-3.5 ${i < Math.floor(recipe.difficulty || 3) ? 'fill-current' : 'opacity-20'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d={STAR} />
                            </svg>
                        ))}
                    </div>
                </div>
            </div>

            {/* Unlock Button Overlay (on hover for premium) */}
            {showUnlock && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center p-6 z-20">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/recipes/${recipe._id}`);
                        }}
                        className="bg-white text-[#007AFF] w-full py-4 rounded-3xl font-black text-sm shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Unlock Recipe
                    </button>
                </div>
            )}
        </div>
    );
}

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert'];
const QUICK_FILTERS = [
    { id: 'under30', label: 'Under 30 min' },
    { id: 'veg', label: 'Vegetarian' },
    { id: 'highProtein', label: 'High Protein' },
    { id: 'lowCalorie', label: 'Low Calorie' },
];

export default function Recipes() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [quickFilter, setQuickFilter] = useState(null);
    const [showAll, setShowAll] = useState(false);

    const isFiltered = selectedCategory !== null || searchTerm.trim() !== '' || quickFilter !== null || showAll;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, recipeRes] = await Promise.allSettled([
                    authAPI.getProfile(),
                    recipeAPI.getAll()
                ]);
                if (profileRes.status === 'fulfilled') {
                    setUser(profileRes.value.data.user || profileRes.value.data);
                }
                if (recipeRes.status === 'fulfilled') {
                    setRecipes(recipeRes.value.data.recipes);
                }
            } catch (error) {
                console.error('Recipes fetchData error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchTerm, quickFilter, showAll]);

    const filteredRecipes = recipes.filter(r => {
        const matchesCategory = selectedCategory === null || r.category === selectedCategory;
        const matchesSearch = !searchTerm.trim() || r.title.toLowerCase().includes(searchTerm.toLowerCase());
        let matchesQuick = true;
        if (quickFilter === 'under30') {
            matchesQuick = (parseInt(r.cookingTime) || 0) <= 30;
        } else if (quickFilter === 'veg') {
            const ingredientsText = r.ingredients?.map(i => i.name || '').join(' ') || '';
            const text = (r.title + ' ' + ingredientsText).toLowerCase();
            matchesQuick = !['chicken', 'beef', 'meat', 'pork', 'mutton', 'fish', 'prawn', 'shrimp'].some(m => text.includes(m));
        } else if (quickFilter === 'highProtein') {
            matchesQuick = (r.protein || 0) >= 20;
        } else if (quickFilter === 'lowCalorie') {
            matchesQuick = (r.calories || 0) > 0 && (r.calories || 0) <= 400;
        }
        return matchesCategory && matchesSearch && matchesQuick;
    });

    const totalPages = Math.ceil(filteredRecipes.length / 8);
    const currentRecipes = filteredRecipes.slice((currentPage - 1) * 8, currentPage * 8);

    const latestRecipes = [...recipes]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
    const popularRecipes = [...recipes]
        .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
        .slice(0, 4);

    const clearAll = () => {
        setSelectedCategory(null);
        setSearchTerm('');
        setQuickFilter(null);
        setShowAll(false);
    };

    const Sidebar = () => (
        <aside className="w-60 flex-shrink-0">
            <div className="bg-[#f8f9fa] dark:bg-[#1e1e1e] p-7 rounded-[2.5rem] flex flex-col gap-5 border border-gray-100 dark:border-gray-800/50 sticky top-10">
                <h3 className="font-black text-gray-900 dark:text-gray-100 text-xl px-2">Categories</h3>
                <div className="flex flex-col gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                setShowAll(false);
                                setSelectedCategory(selectedCategory === cat ? null : cat);
                            }}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all ${
                                selectedCategory === cat
                                ? 'bg-[#007AFF] text-white shadow-xl shadow-blue-200 dark:shadow-none translate-x-1.5'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedCategory === cat ? 'border-white' : 'border-gray-300 dark:border-gray-700'}`}>
                                {selectedCategory === cat && <div className="w-2.5 h-2.5 rounded-full bg-white animate-in zoom-in" />}
                            </div>
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-800 mx-2" />
                <div className="flex flex-col gap-3">
                    <button onClick={() => navigate('/saved-recipes')} className="w-full py-4 px-6 bg-white dark:bg-[#252525] border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-200 font-black text-xs hover:shadow-2xl transition-all active:scale-95 uppercase tracking-widest">
                        Saved
                    </button>
                    <button onClick={() => navigate('/leaderboard')} className="w-full py-4 px-6 bg-white dark:bg-[#252525] border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-200 font-black text-xs hover:shadow-2xl transition-all active:scale-95 uppercase tracking-widest">
                        Leaderboard
                    </button>
                </div>
            </div>
        </aside>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] dark:bg-[#121212]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007AFF]" />
            </div>
        );
    }

    if (isFiltered) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#121212] flex flex-col pb-20">
                <Navbar activePage="recipes" user={user} />
                <div className="flex flex-col px-10 py-10 gap-10 max-w-[1700px] mx-auto w-full">
                    {/* Filter bar */}
                    <div className="flex items-center gap-4 flex-wrap">
                        {['All', ...CATEGORIES].map(cat => (
                            <button
                                key={cat}
                                onClick={() => {
                                    if (cat === 'All') {
                                        setSelectedCategory(null);
                                        if (!searchTerm && !quickFilter) setShowAll(false);
                                    } else {
                                        setSelectedCategory(selectedCategory === cat ? null : cat);
                                        setShowAll(false);
                                    }
                                }}
                                className={`px-7 py-3 rounded-full text-xs font-black transition-all border ${
                                    (cat === 'All' && selectedCategory === null) || selectedCategory === cat
                                    ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-2xl shadow-blue-200 dark:shadow-none'
                                    : 'bg-white dark:bg-[#252525] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-white hover:shadow-lg'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-800 mx-1" />
                        {QUICK_FILTERS.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setQuickFilter(quickFilter === filter.id ? null : filter.id)}
                                className={`px-6 py-3 rounded-full text-xs font-bold transition-all border ${
                                    quickFilter === filter.id
                                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100 shadow-xl'
                                    : 'bg-white dark:bg-[#252525] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-white hover:shadow-lg'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                        <div className="ml-auto flex items-center gap-6">
                            <div className="w-96">
                                <RecipeSearchBar onSearchComplete={(val) => setSearchTerm(val)} />
                            </div>
                            <button onClick={clearAll} className="text-xs font-black text-[#007AFF] hover:underline px-2 uppercase tracking-widest">
                                Clear Results
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {currentRecipes.length > 0 ? currentRecipes.map(recipe => (
                            <RecipeCard key={recipe._id} recipe={recipe} navigate={navigate} user={user} />
                        )) : (
                            <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-20">
                                <svg className="w-32 h-32 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.022.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517z" /></svg>
                                <h3 className="text-3xl font-black">No recipes found</h3>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-12">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:shadow-2xl transition-all shadow-md group"
                            >
                                <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-14 h-14 rounded-2xl font-black transition-all text-sm ${currentPage === p ? 'bg-[#007AFF] text-white shadow-2xl shadow-blue-200 scale-110' : 'text-gray-500 bg-white dark:bg-[#252525] border border-gray-100 dark:border-gray-700 hover:shadow-xl'}`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:shadow-2xl transition-all shadow-md group"
                            >
                                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#121212] flex flex-col transition-colors">
            <Navbar activePage="recipes" user={user} />
            <div className="flex gap-12 px-10 py-12 max-w-[1700px] mx-auto w-full items-start">
                <Sidebar />
                <div className="flex-grow flex flex-col gap-16 min-w-0">
                    {/* LATEST SECTION */}
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Latest Recipes</h2>
                            <div className="w-[450px]">
                                <RecipeSearchBar onSearchComplete={(val) => { if (val) setSearchTerm(val); }} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {latestRecipes.map(recipe => (
                                <RecipeCard key={recipe._id} recipe={recipe} navigate={navigate} user={user} />
                            ))}
                        </div>
                    </div>

                    {/* POPULAR MENU SECTION */}
                    <div className="flex flex-col gap-10">
                        <div className="flex items-center gap-5 flex-wrap">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mr-4">Popular Menu</h2>
                            {QUICK_FILTERS.map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setQuickFilter(quickFilter === filter.id ? null : filter.id)}
                                    className={`px-6 py-3 rounded-full text-xs font-black border transition-all ${
                                        quickFilter === filter.id 
                                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100 shadow-2xl scale-105' 
                                        : 'bg-white dark:bg-[#252525] border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-white hover:shadow-xl'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10">
                            {popularRecipes.map(recipe => (
                                <RecipeCard key={recipe._id} recipe={recipe} navigate={navigate} user={user} />
                            ))}
                        </div>
                        <div className="flex justify-center pt-8">
                            <button
                                onClick={() => setShowAll(true)}
                                className="group flex items-center gap-4 px-16 py-5 rounded-[2.5rem] bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-extrabold text-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 transition-all duration-500"
                            >
                                Explore All Recipes
                                <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
