import React, { useMemo } from 'react';
import {
    Users, BookOpen, Star, TrendingUp, TrendingDown,
    Activity, Award, Clock, ChefHat, Flame,
} from 'lucide-react';

/* ─── Overview Tab: Platform-wide command center ─────────────── */
const AdminOverview = ({ users, recipes }) => {
    const now = new Date();

    /* ── KPI calculations ── */
    const totalUsers    = users.length;
    const totalRecipes  = recipes.length;
    const premiumCount  = recipes.filter(r => r.isPremium).length;
    const pendingCount  = recipes.filter(r => r.status === 'pending').length;
    const approvedCount = recipes.filter(r => r.status === 'approved').length;
    const rejectedCount = recipes.filter(r => r.status === 'rejected').length;

    const thisMonthUsers = useMemo(() => users.filter(u => {
        const d = new Date(u.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length, [users]);

    const thisMonthRecipes = useMemo(() => recipes.filter(r => {
        const d = new Date(r.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length, [recipes]);

    /* ── Top chefs by recipe count ── */
    const topChefs = useMemo(() => {
        const map = {};
        recipes.forEach(r => {
            const key = r.chefName || 'Unknown';
            if (!map[key]) map[key] = { name: key, count: 0, premium: 0 };
            map[key].count++;
            if (r.isPremium) map[key].premium++;
        });
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [recipes]);

    /* ── Recent activity feed (last 8 events) ── */
    const recentActivity = useMemo(() => {
        const events = [
            ...recipes.map(r => ({
                type: 'recipe',
                label: r.title,
                sub: `by Chef ${r.chefName}`,
                date: new Date(r.createdAt),
                color: r.isPremium ? '#f59e0b' : '#6366f1',
            })),
            ...users.map(u => ({
                type: 'user',
                label: u.name,
                sub: u.email,
                date: new Date(u.createdAt),
                color: '#3b82f6',
            })),
        ].sort((a, b) => b.date - a.date).slice(0, 8);
        return events;
    }, [users, recipes]);

    /* ── Platform health score (simple heuristic) ── */
    const healthScore = totalRecipes > 0
        ? Math.round((approvedCount / totalRecipes) * 100)
        : 0;
    const healthColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444';

    /* ── Category breakdown ── */
    const categories = useMemo(() => {
        const map = {};
        recipes.forEach(r => {
            const c = r.category || 'Uncategorized';
            map[c] = (map[c] || 0) + 1;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
    }, [recipes]);

    const catMax = categories[0]?.[1] || 1;

    return (
        <div className="space-y-6">
            {/* ── KPI strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { icon: <Users size={20}/>,    label: 'Total Users',    val: totalUsers,    sub: `+${thisMonthUsers} this month`,  color: 'blue'   },
                    { icon: <BookOpen size={20}/>,  label: 'Total Recipes',  val: totalRecipes,  sub: `+${thisMonthRecipes} this month`, color: 'indigo' },
                    { icon: <Clock size={20}/>,     label: 'Pending Review', val: pendingCount,  sub: `${approvedCount} approved`,       color: 'amber'  },
                    { icon: <Star size={20}/>,      label: 'Premium Content',val: premiumCount,  sub: `${totalRecipes ? ((premiumCount/totalRecipes)*100).toFixed(0) : 0}% of library`, color: 'violet' },
                ].map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Health ring + stats ── */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-gray-100 dark:border-gray-800 p-7 flex flex-col items-center gap-5 shadow-sm">
                    <h4 className="text-sm font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-widest self-start">Content Health</h4>
                    <HealthRing score={healthScore} color={healthColor} />
                    <div className="w-full grid grid-cols-3 gap-2 text-center">
                        {[
                            { label: 'Active',  val: approvedCount, color: '#10b981' },
                            { label: 'Pending', val: pendingCount,  color: '#f59e0b' },
                            { label: 'On Hold', val: rejectedCount, color: '#ef4444' },
                        ].map(s => (
                            <div key={s.label} className="rounded-xl py-2 px-1" style={{ backgroundColor: s.color + '18' }}>
                                <p className="text-base font-black" style={{ color: s.color }}>{s.val}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Top chefs leaderboard ── */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-gray-100 dark:border-gray-800 p-7 shadow-sm">
                    <h4 className="text-sm font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-5">Top Chefs</h4>
                    <div className="space-y-3">
                        {topChefs.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data yet</p>}
                        {topChefs.map((chef, i) => (
                            <div key={chef.name} className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                                    i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                }`}>{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{chef.name}</span>
                                        <span className="text-xs font-black text-gray-900 dark:text-white ml-2 shrink-0">{chef.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-indigo-400 transition-all duration-500"
                                            style={{ width: `${(chef.count / (topChefs[0]?.count || 1)) * 100}%` }} />
                                    </div>
                                </div>
                                {chef.premium > 0 && (
                                    <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md shrink-0">
                                        <Star size={7} className="fill-current"/> {chef.premium}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Recent activity ── */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-gray-100 dark:border-gray-800 p-7 shadow-sm">
                    <h4 className="text-sm font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-5">Recent Activity</h4>
                    <div className="space-y-3 overflow-y-auto max-h-[220px] custom-scrollbar pr-1">
                        {recentActivity.map((ev, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: ev.color + '20' }}>
                                    {ev.type === 'recipe'
                                        ? <ChefHat size={12} style={{ color: ev.color }} />
                                        : <Users    size={12} style={{ color: ev.color }} />
                                    }
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{ev.label}</p>
                                    <p className="text-[10px] text-gray-400 font-medium truncate">{ev.sub}</p>
                                </div>
                                <span className="text-[9px] text-gray-300 dark:text-gray-600 font-semibold shrink-0 ml-auto mt-0.5">
                                    {ev.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Category breakdown bars ── */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-gray-100 dark:border-gray-800 p-7 shadow-sm">
                <h4 className="text-sm font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-6">Recipes by Category</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.length === 0 && <p className="text-sm text-gray-400 col-span-3 text-center py-4">No data yet</p>}
                    {categories.map(([cat, count], i) => {
                        const pct = (count / catMax) * 100;
                        const PALETTE = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6'];
                        const clr = PALETTE[i % PALETTE.length];
                        return (
                            <div key={cat} className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 capitalize">{cat}</span>
                                    <span className="text-xs font-black text-gray-900 dark:text-white">{count}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                    <div className="h-2 rounded-full transition-all duration-700"
                                        style={{ width: `${pct}%`, backgroundColor: clr }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/* ── KPI Card ────────────────────────────────────────────────── */
const COLOR = {
    blue:   { bg: '#eff6ff', dark: '#1d4ed820', text: '#3b82f6' },
    indigo: { bg: '#eef2ff', dark: '#4338ca20', text: '#6366f1' },
    amber:  { bg: '#fffbeb', dark: '#d9770620', text: '#f59e0b' },
    violet: { bg: '#f5f3ff', dark: '#7c3aed20', text: '#8b5cf6' },
};

const KpiCard = ({ icon, label, val, sub, color }) => {
    const c = COLOR[color];
    return (
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: c.text + '18', color: c.text }}>
                    {icon}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            </div>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tighter leading-none">{val}</h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-1.5">{sub}</p>
        </div>
    );
};

/* ── Platform Health Ring ────────────────────────────────────── */
const HealthRing = ({ score, color }) => {
    const r  = 46;
    const C  = 2 * Math.PI * r;
    const dash = (score / 100) * C;

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="-rotate-90 w-full h-full" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={r} fill="none" stroke="#f1f5f9" className="dark:stroke-gray-800" strokeWidth="10" />
                <circle cx="55" cy="55" r={r} fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${C}`}
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-gray-900 dark:text-white" style={{ color }}>{score}%</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Health</span>
            </div>
        </div>
    );
};

export default AdminOverview;
