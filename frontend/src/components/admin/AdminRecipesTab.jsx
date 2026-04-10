import React, { useState } from 'react';
import { Star, AlertTriangle, Eye, CheckCircle, PauseCircle, Trash2, ChefHat } from 'lucide-react';

const AdminRecipesTab = ({ recipes, navigate, onUpdateStatus, onDeleteRecipe, isDeleting }) => {
    const [deletingRecipe, setDeletingRecipe] = useState(null);
    const [deleteReason,   setDeleteReason]   = useState('');

    const handleSubmitDelete = (e) => {
        e.preventDefault();
        onDeleteRecipe(deletingRecipe, deleteReason);
        setDeletingRecipe(null);
        setDeleteReason('');
    };

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                    <tr className="bg-gray-50/70 dark:bg-black/10">
                        {['Recipe', 'Author', 'Category', 'Status', 'Actions'].map((h, i) => (
                            <th key={h} className={`px-7 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest ${i === 4 ? 'text-right' : ''}`}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                    {recipes.length > 0 ? recipes.map(recipe => (
                        <tr key={recipe._id} className="group hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition duration-150">
                            <td className="px-7 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                        <ChefHat size={16} className="text-primary" />
                                    </div>
                                    <div className="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5 truncate max-w-[200px]">
                                        {recipe.title}
                                        {recipe.isPremium && <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />}
                                    </div>
                                </div>
                            </td>
                            <td className="px-7 py-4 text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Chef {recipe.chefName}</td>
                            <td className="px-7 py-4">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                                    {recipe.category || '—'}
                                </span>
                            </td>
                            <td className="px-7 py-4">
                                <StatusBadge status={recipe.status} />
                            </td>
                            <td className="px-7 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <ActionBtn onClick={() => navigate(`/recipes/${recipe._id}`)} Icon={Eye} theme="gray" />
                                    <ActionBtn 
                                        onClick={() => onUpdateStatus(recipe._id, recipe.status === 'approved' ? 'rejected' : 'approved')} 
                                        Icon={recipe.status === 'approved' ? PauseCircle : CheckCircle} 
                                        theme={recipe.status === 'approved' ? 'amber' : 'emerald'} 
                                    />
                                    <ActionBtn onClick={() => setDeletingRecipe(recipe)} Icon={Trash2} theme="red" />
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-gray-400 text-sm font-medium">No recipes found.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {deletingRecipe && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setDeletingRecipe(null)} />
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 p-8 border border-gray-100 dark:border-gray-800 animate-slideUp">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Delete Recipe</h2>
                        <p className="text-gray-400 text-sm mb-6">Confirm deletion for <span className="font-bold">{deletingRecipe.title}</span>.</p>
                        <form onSubmit={handleSubmitDelete} className="space-y-4">
                            <textarea
                                required rows={4} value={deleteReason} onChange={e => setDeleteReason(e.target.value)}
                                placeholder="Reason for deletion..."
                                className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-red-500/20 outline-none text-sm"
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setDeletingRecipe(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold text-sm">Cancel</button>
                                <button type="submit" disabled={isDeleting} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20">
                                    {isDeleting ? 'Deleting...' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const STYLES = {
        approved: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
        rejected: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
        pending: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    };
    return (
        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${STYLES[status] || STYLES.pending}`}>
            {status}
        </span>
    );
};

const ActionBtn = ({ onClick, Icon, theme }) => {
    const THEMES = {
        gray: 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-900',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 hover:bg-emerald-500 hover:text-white',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 hover:bg-amber-500 hover:text-white',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white',
    };
    return (
        <button onClick={onClick} className={`p-2 rounded-lg transition-all duration-200 ${THEMES[theme]}`}>
            <Icon size={14} />
        </button>
    );
};

export default AdminRecipesTab;
