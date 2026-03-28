import React from 'react';

export default function PremiumLockedState({ recipe, handlePurchase, navigate }) {
    return (
        <div className="h-full flex flex-col justify-center items-center text-center">
            <div className="mb-6 w-full max-w-md px-6">
                <h1 className="text-3xl font-extrabold text-[#1a1a1a] dark:text-white mb-2">{recipe.title}</h1>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    <span>By Chef {recipe.user?.name || recipe.chefName}</span>
                    <span>• {recipe.cookingTime}</span>
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Premium
                    </span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-8 rounded-[32px] w-full mt-6 shadow-sm transition-colors">
                    <div className="text-amber-800 dark:text-amber-200/80 font-medium mb-4">Unlock this premium recipe to see ingredients and step-by-step instructions.</div>
                    <div className="text-3xl font-black text-amber-900 dark:text-amber-100 mb-6 flex items-baseline justify-center">
                        <span className="text-lg mr-1">Rs.</span>
                        {recipe.price || 0}
                    </div>
                    <button
                        onClick={handlePurchase}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-lg transition shadow-lg shadow-amber-200 dark:shadow-none flex items-center justify-center space-x-3 mb-4 active:scale-95"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <span>Pay with Khalti</span>
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-2 text-gray-400 dark:text-gray-500 font-bold hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
