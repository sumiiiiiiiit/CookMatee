import React from 'react';

export default function RecipeDetailHeader({
    recipe,
    isLiked,
    isSaved,
    handleLike,
    handleSave,
    setIsChatOpen,
    handleChatWithChef,
    handleExportPDF,
    showLocked,
    isOwned
}) {
    return (
        <>
            <div className="flex justify-between items-start mb-4">
                <h1 className="text-4xl font-extrabold text-[#1a1a1a] dark:text-white leading-tight">
                    {recipe.title}
                </h1>
                <div className="flex space-x-2">
                    <button onClick={handleLike} className={`p-3 rounded-full border transition-all flex items-center gap-2 ${isLiked ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40 text-red-500' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-red-500'}`} title="Like Recipe">
                        <svg className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        <span className="font-bold text-sm">{recipe.likes?.length || 0}</span>
                    </button>
                    <button onClick={handleSave} className={`p-3 rounded-full border transition-all ${isSaved ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/40 text-amber-500' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-amber-500'}`} title="Save to Cookbook">
                        <svg className="w-6 h-6" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    </button>
                    {!showLocked && recipe.isPremium && (
                        <button onClick={() => setIsChatOpen(true)} className="p-3 rounded-full border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/40 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all active:scale-95" title="Ask AI ChefBot">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </button>
                    )}
                    
                    {!showLocked && !isOwned && recipe.isPremium && (
                        <button onClick={handleChatWithChef} className="p-3 rounded-full border bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/40 text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all active:scale-95" title="Chat with Chef">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </button>
                    )}

                    {recipe.isPremium && !showLocked && (
                        <button onClick={handleExportPDF} className="p-3 rounded-full border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-95" title="Export PDF">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8 space-x-6 flex-wrap gap-y-2">
                <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {recipe.cookingTime}
                </span>
                {recipe.cookingMethod && (
                    <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                        <span className="capitalize">{recipe.cookingMethod.replace('_', ' ')}</span>
                    </span>
                )}
                <div className="flex text-amber-400 dark:text-amber-500 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-5 h-5 ${i < recipe.difficulty ? 'fill-current' : 'text-gray-200 dark:text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                </div>
                <span className="flex items-center italic">
                    By <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">Chef {recipe.user?.name || recipe.chefName}</span>
                </span>
                {recipe.calories > 0 && (
                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.334-.398-1.817a1 1 0 00-1.514-.857 4.028 4.028 0 00-1.888 1.867c-.372.769-.45 1.704-.45 2.721 0 1.174.335 2.261.959 3.068a3.7 3.7 0 00.458.49 5.039 5.039 0 004.3 2.25 5.039 5.039 0 004.3-2.25 3.7 3.7 0 00.458-.49c.624-.807.959-1.894.959-3.068 0-1.017-.078-1.952-.45-2.721a4.028 4.028 0 00-1.888-1.867 1 1 0 00-1.514.857c0 .483-.07 1.137-.398 1.817a2.64 2.64 0 01-.945 1.067 31.365 31.365 0 00-.613-3.58c-.226-.966-.506-1.93-.84-2.734a12.13 12.13 0 00-.57-1.116 3.66 3.66 0 00-.822-.88z" clipRule="evenodd" /></svg>
                        {recipe.calories} kcal
                    </span>
                )}
            </div>
        </>
    );
}
