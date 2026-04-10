import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../hooks/useRecipes';

const RecipesSidebar = ({ selectedCategory, setSelectedCategory, setShowAll }) => {
    const navigate = useNavigate();
    return (
        <aside className="w-60 flex-shrink-0">
            <div className="bg-[#f8f9fa] dark:bg-[#1e1e1e] p-7 rounded-[2.5rem] flex flex-col gap-5 border border-gray-100 dark:border-gray-800/50 sticky top-10">
                <h3 className="font-black text-gray-900 dark:text-gray-100 text-xl px-2">Categories</h3>
                <div className="flex flex-col gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setShowAll(false); setSelectedCategory(selectedCategory === cat ? null : cat); }}
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
                    <button onClick={() => navigate('/saved-recipes')} className="w-full py-4 px-6 bg-white dark:bg-[#252525] border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-200 font-black text-xs hover:shadow-2xl transition-all active:scale-95 uppercase tracking-widest">Saved</button>
                    <button onClick={() => navigate('/recipes/leaderboard')} className="w-full py-4 px-6 bg-white dark:bg-[#252525] border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-200 font-black text-xs hover:shadow-2xl transition-all active:scale-95 uppercase tracking-widest">Leaderboard</button>
                </div>
            </div>
        </aside>
    );
};

export default RecipesSidebar;
