import React from 'react';
import { BookOpen, Star, ChefHat, TrendingUp } from 'lucide-react';

const AdminStats = ({ activeTab, users, recipes }) => {
    const totalRecipes   = recipes.length;
    const premiumRecipes = recipes.filter(r => r.isPremium).length;
    const normalRecipes  = totalRecipes - premiumRecipes;

    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const standardUsers = totalUsers - adminUsers;

    if (activeTab === 'recipes') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatBox label="Total Recipes" value={totalRecipes} icon={<BookOpen size={20}/>} color="indigo" trend={8} />
                <StatBox label="Normal Recipes" value={normalRecipes} icon={<ChefHat size={20}/>} color="emerald" trend={12} />
                <StatBox label="Premium Recipes" value={premiumRecipes} icon={<Star size={20}/>} color="amber" trend={5} />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatBox label="Total Users" value={totalUsers} icon={<BookOpen size={20}/>} color="blue" trend={15} />
            <StatBox label="Standard Users" value={standardUsers} icon={<ChefHat size={20}/>} color="violet" trend={10} />
            <StatBox label="Administrators" value={adminUsers} icon={<Star size={20}/>} color="indigo" trend={0} />
        </div>
    );
};

const StatBox = ({ label, value, icon, color, trend }) => {
    const COLORS = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
        violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600',
    };

    return (
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${COLORS[color]}`}>
                    {icon}
                </div>
                {trend > 0 && (
                    <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                        <TrendingUp size={12} /> +{trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}</h3>
            </div>
            
            <div className="mt-6 flex items-end gap-1 h-8">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`flex-1 rounded-full ${COLORS[color].split(' ')[0]} opacity-40`}
                        style={{ height: `${20 + Math.random() * 80}%` }}
                    />
                ))}
            </div>
        </div>
    );
};

export default AdminStats;
