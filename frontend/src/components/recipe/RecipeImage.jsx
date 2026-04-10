import React from 'react';

export default function RecipeImage({ recipe, getImageUrl, isOwned, isRecentlyUnlocked }) {
    return (
        <div className="relative flex justify-center mb-6">
            <div className="relative w-full max-w-[320px] aspect-[4/5] rounded-[32px] overflow-hidden shadow-lg transition-all">
                {recipe.image ? (
                    <img 
                        src={getImageUrl(recipe.image)} 
                        alt={recipe.title} 
                        className="w-full h-full object-cover" 
                        style={{ imageRendering: 'high-quality' }}
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
                        <svg className="w-24 h-24 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                {recipe.isPremium && (
                    <div className={`absolute top-6 left-6 ${isRecentlyUnlocked || isOwned ? 'bg-emerald-500' : 'bg-amber-500'} text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center space-x-2 z-10`}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            {isRecentlyUnlocked || isOwned ? (
                                <path d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            ) : (
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            )}
                        </svg>
                        <span>{isRecentlyUnlocked || isOwned ? 'Unlocked' : 'Premium Content'}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
