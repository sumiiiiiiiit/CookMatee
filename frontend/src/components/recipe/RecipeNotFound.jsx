import React from 'react';
import Navbar from '../common/Navbar';

export default function RecipeNotFound({ navigate }) {
    return (
        <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#121212] flex flex-col transition-colors duration-300">
            <Navbar activePage="recipes" />
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">Recipe Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">This recipe might have been deleted or is currently unavailable.</p>
                <button onClick={() => navigate('/recipes')} className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition-all hover:bg-secondary">Back to Recipes</button>
            </div>
        </div>
    );
}
