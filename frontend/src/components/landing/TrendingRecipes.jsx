import React from 'react';
import { Utensils, Heart, Star, Crown, Clock } from 'lucide-react';
import { getImageUrl } from '../../lib/api';

export default function TrendingRecipes({ displayRecipes }) {
    return (
        <section id="recipes" className="py-24 bg-white dark:bg-[#1a1a1a] relative z-10 border-y border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black mb-4">Trending Recipes</h2>
                    <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {displayRecipes && displayRecipes.length > 0 ? displayRecipes.map((recipe, index) => (
                        <div key={recipe._id || index} className="group cursor-pointer animate-slideUp" style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="relative h-64 rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-all duration-300 bg-gray-100 dark:bg-gray-800">
                                {recipe.image ? (
                                    <img src={getImageUrl(recipe.image)} alt={recipe.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-200 dark:bg-gray-700">
                                        <Utensils className="h-12 w-12 opacity-50 absolute" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                                
                                {/* Premium Badge */}
                                {recipe.isPremium && (
                                    <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20 flex items-center shadow-amber-500/30 border border-amber-400">
                                        <Crown className="h-3 w-3 mr-1" /> Premium
                                    </div>
                                )}

                                {/* Difficulty Badge */}
                                {recipe.difficulty && (
                                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-xs font-bold px-2 py-1 rounded-md shadow-sm z-20 capitalize text-gray-800 dark:text-gray-200">
                                        {recipe.difficulty}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">{recipe.category || 'General'}</span>
                                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs font-semibold">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {recipe.cookingTime || '30'} mins
                                </div>
                            </div>
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{recipe.title}</h3>
                        </div>
                    )) : (
                        // Placeholders while loading
                        [1,2,3,4].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2 w-1/4"></div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
