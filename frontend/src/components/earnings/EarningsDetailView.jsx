import React from 'react';
import { Calendar } from 'lucide-react';
import { getImageUrl } from '../../lib/api';

const EarningsDetailView = ({ selectedRecipe, stats }) => {
    return (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            {selectedRecipe ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center"><h3 className="text-xl font-bold">Recipe Audience</h3><div className="text-right"><div className="text-2xl font-black text-primary">{selectedRecipe.purchasers?.length || 0}</div><div className="text-xs font-bold text-gray-400 uppercase">Total Sales</div></div></div>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                        {!selectedRecipe.purchasers?.length ? <div className="text-center py-10 border-2 border-dashed rounded-2xl"><p className="text-gray-400">No sales yet.</p></div> : 
                        selectedRecipe.purchasers.map((user, i) => (
                            <div key={user.id + i} className="flex items-center justify-between p-4 rounded-xl border hover:shadow-md transition">
                                <div className="flex items-center space-x-4"><div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">{user.profilePicture ? <img src={getImageUrl(user.profilePicture)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10 font-bold">{user.name.charAt(0)}</div>}</div><div className="font-bold">{user.name}<p className="text-xs text-gray-400 flex items-center font-normal"><Calendar className="w-3 h-3 mr-1" />{new Date(user.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p></div></div>
                                <div className="text-green-500 font-bold bg-green-50 px-3 py-1.5 rounded-lg text-sm">+ Rs. {selectedRecipe.price}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="h-64 mt-8 relative flex items-end justify-between px-4">
                    <h3 className="absolute -top-12 left-0 text-xl font-bold">Monthly Growth</h3>
                    {(stats?.recipes || []).slice(0, 7).map((recipe, i) => {
                        const maxRev = Math.max(...stats.recipes.map(r => r.revenue)) || 1;
                        const height = Math.max(15, (recipe.revenue / maxRev) * 100);
                        const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#6366f1'];
                        return (
                            <div key={recipe._id} className="flex flex-col items-center space-y-4 group relative h-full justify-end" style={{width: `${100 / 8}%`}}>
                                <div className="absolute -top-12 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 font-bold">Rs. {recipe.revenue.toLocaleString()}</div>
                                <div className="w-8 sm:w-12 rounded-t-xl shadow-md relative overflow-hidden" style={{ height: `${height}%`, backgroundColor: colors[i % colors.length] }}><div className="absolute top-0 left-0 w-full h-1/3 bg-white/20"></div></div>
                                <p className="text-[10px] font-black truncate w-full text-center">{recipe.title}</p>
                            </div>
                        );
                    })}
                    <div className="absolute bottom-[44px] left-0 w-full h-px bg-gray-100 dark:border-gray-800"></div>
                </div>
            )}
        </div>
    );
};

export default EarningsDetailView;
