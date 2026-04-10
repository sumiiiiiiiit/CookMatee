import React from 'react';
import { BookOpen, Star, ChefHat, TrendingUp } from 'lucide-react';

const AdminStats = ({ activeTab, users, recipes }) => {
    const totalRecipes   = recipes.length;
    const premiumRecipes = recipes.filter(r => r.isPremium).length;
    const normalRecipes  = totalRecipes - premiumRecipes;

    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const standardUsers = totalUsers - adminUsers;

    // Dummy data for Monthly Sales Growth chart
    const monthlySales = [
        { label: 'Jan', val: 1200 },
        { label: 'Feb', val: 1900 },
        { label: 'Mar', val: 1500 },
        { label: 'Apr', val: 2100 },
        { label: 'May', val: 2500 },
        { label: 'Jun', val: 2300 },
    ];
    const maxSale = Math.max(...monthlySales.map(s => s.val), 1);

    if (activeTab === 'recipes') {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatBox label="Total Recipes" value={totalRecipes} icon={<BookOpen size={20}/>} color="indigo" trend={8} />
                    <StatBox label="Normal Recipes" value={normalRecipes} icon={<ChefHat size={20}/>} color="emerald" trend={12} />
                    <StatBox label="Premium Recipes" value={premiumRecipes} icon={<Star size={20}/>} color="amber" trend={5} />
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Monthly Sales Growth</h3>
                            <p className="text-sm text-gray-400 mt-1 font-medium">Comparing top recipes across the quarter</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-sm font-bold">
                            <TrendingUp size={14} /> +12.5
                        </div>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-4 px-2">
                        {monthlySales.map((sale, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                <div className="relative w-full flex flex-col items-center justify-end h-full">
                                    <div 
                                        className="w-full max-w-[60px] rounded-t-2xl bg-gradient-to-b from-primary/80 to-primary/10 transition-all duration-500 group-hover:from-primary shadow-lg shadow-primary/10"
                                        style={{ height: `${(sale.val / maxSale) * 100}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                            Rs. {sale.val}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{sale.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
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
