import React from 'react';
import { TrendingUp, PieChart, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../../lib/api';

const EarningsSidebar = ({ stats, selectedRecipe, setSelectedRecipe }) => {
    return (
        <div className="w-[350px] bg-white dark:bg-[#1a1a1a] border-r border-gray-100 dark:border-gray-800 flex flex-col h-full shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold dark:text-white mb-1">Performance</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold">Track your content</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <button
                    onClick={() => setSelectedRecipe(null)}
                    className={`w-full p-4 flex items-center space-x-4 border-b border-gray-50 dark:border-gray-800 transition-all group ${
                        selectedRecipe === null ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className={`font-bold ${selectedRecipe === null ? 'text-primary' : 'text-gray-800 dark:text-gray-200'}`}>Account Overview</h3>
                        <p className="text-xs text-gray-500 mt-1">All premium recipes</p>
                    </div>
                </button>
                
                <div className="px-6 py-4 bg-gray-50/50 dark:bg-black/20">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Specific Recipes</h4>
                </div>

                {!stats?.recipes?.length ? (
                    <div className="p-8 text-center text-gray-400">
                        <PieChart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No premium recipes yet</p>
                    </div>
                ) : (
                    stats.recipes.map((recipe) => (
                        <button
                            key={recipe._id}
                            onClick={() => setSelectedRecipe(recipe)}
                            className={`w-full p-4 flex items-center space-x-4 border-b border-gray-50 dark:border-gray-800 transition-all group ${
                                selectedRecipe?._id === recipe._id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                                <img src={getImageUrl(recipe.image)} alt={recipe.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                {recipe.salesCount > 0 && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-1 rounded-bl-lg font-bold">+{recipe.salesCount}</div>}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h3 className={`font-bold truncate ${selectedRecipe?._id === recipe._id ? 'text-primary' : 'text-gray-800 dark:text-gray-200'}`}>{recipe.title}</h3>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Rs. {recipe.revenue.toLocaleString()}</span>
                                    <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500">{recipe.salesCount} sales</span>
                                </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform ${selectedRecipe?._id === recipe._id ? 'text-primary' : ''}`} />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default EarningsSidebar;
