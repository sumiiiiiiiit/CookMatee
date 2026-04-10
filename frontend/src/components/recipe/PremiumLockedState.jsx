import React from 'react';

export default function PremiumLockedState({ recipe, handlePurchase, onClose }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="bg-white dark:bg-[#1a1a1a] rounded-[40px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden transform transition-all animate-in zoom-in duration-300 border border-gray-100 dark:border-gray-800">
                <div className="px-10 py-10 text-center">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600 dark:text-amber-400">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
                        </svg>
                    </div>
                    
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">Premium Recipe</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">Unlock this masterpiece and start cooking like a pro!</p>
                    
                    <div className="bg-gray-50 dark:bg-black/20 rounded-3xl p-6 mb-8 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="text-left">
                            <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">One-time Unlock</div>
                            <div className="text-xl font-black text-gray-900 dark:text-white">{recipe.title}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Price</div>
                            <div className="text-2xl font-black text-[#60BB46]">Rs. {recipe.price || 0}</div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handlePurchase}
                            className="w-full py-5 bg-[#60BB46] hover:bg-[#50993A] text-white rounded-[24px] font-black text-lg transition shadow-xl shadow-green-200 dark:shadow-none flex items-center justify-center space-x-3 active:scale-95"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Pay with eSewa</span>
                        </button>
                        
                        <button
                            onClick={onClose}
                            className="w-full py-4 text-gray-400 dark:text-gray-500 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
