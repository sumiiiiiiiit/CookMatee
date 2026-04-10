import React, { useState } from 'react';
import { Star, Activity } from 'lucide-react';

const AdminRecipesTab = ({ recipes, navigate, onUpdateStatus, onDeleteRecipe, isDeleting }) => {
    const [deletingRecipe, setDeletingRecipe] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');

    const handleSubmitDelete = (e) => {
        e.preventDefault();
        onDeleteRecipe(deletingRecipe, deleteReason);
        setDeletingRecipe(null);
        setDeleteReason('');
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold dark:text-white">Content Moderation</h3>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-gray-50/50 dark:bg-black/10 text-xs text-gray-400 uppercase tracking-widest font-bold">
                            <tr>
                                <th className="px-8 py-5">Recipe</th>
                                <th className="px-8 py-5">Author</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {recipes.length > 0 ? recipes.map(recipe => (
                                <tr key={recipe._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition duration-200">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-2">
                                            <span>{recipe.title}</span>
                                            {recipe.isPremium && <Star className="w-3 h-3 text-amber-500 fill-current" />}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{recipe.category}</div>
                                    </td>
                                    <td className="px-8 py-5 text-gray-500 font-medium">Chef {recipe.chefName}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm flex inline-flex items-center ${recipe.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            recipe.status === 'rejected' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${recipe.status === 'approved' ? 'bg-green-500' : recipe.status === 'rejected' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                                            {recipe.status === 'approved' ? 'Active' : recipe.status === 'rejected' ? 'Hold' : recipe.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end">
                                            <div className="inline-flex rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 divide-x divide-gray-200 dark:divide-gray-700 overflow-hidden">
                                                <button onClick={() => navigate(`/recipes/${recipe._id}`)} className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 text-xs font-bold transition">View</button>
                                                <button onClick={() => onUpdateStatus(recipe._id, recipe.status === 'approved' ? 'rejected' : 'approved')} className={`px-4 py-2 text-xs font-bold transition w-[90px] ${recipe.status === 'approved' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                                    {recipe.status === 'approved' ? 'Hold' : 'Activate'}
                                                </button>
                                                <button onClick={() => setDeletingRecipe(recipe)} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 text-xs font-bold transition">Delete</button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="px-8 py-20 text-center text-gray-500">No recipes found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {deletingRecipe && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setDeletingRecipe(null)}></div>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-[40px] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden border border-gray-100 dark:border-gray-800">
                        <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                            <div>
                                <h2 className="text-2xl font-extrabold text-[#1a1a1a] dark:text-white">Delete Recipe</h2>
                                <p className="text-gray-400 text-sm font-medium mt-1">Provide a reason to notify Chef {deletingRecipe.chefName}</p>
                            </div>
                            <button onClick={() => setDeletingRecipe(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition p-2 rounded-full">✕</button>
                        </div>
                        <form onSubmit={handleSubmitDelete} className="p-10 space-y-6">
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-2xl flex items-center space-x-4">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center text-red-500 shrink-0"><Activity size={20} /></div>
                                <div className="truncate font-bold text-red-900 dark:text-red-100">{deletingRecipe.title}</div>
                            </div>
                            <textarea required rows="5" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} placeholder="Reason for deletion..." className="w-full px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white"></textarea>
                            <div className="flex space-x-4 pt-4">
                                <button type="button" onClick={() => setDeletingRecipe(null)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-[24px] font-bold">Cancel</button>
                                <button type="submit" disabled={isDeleting || !deleteReason.trim()} className="flex-[2] py-4 bg-red-500 text-white rounded-[24px] font-bold shadow-xl shadow-red-500/20 flex items-center justify-center space-x-3">
                                    {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Confirm Deletion"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRecipesTab;
