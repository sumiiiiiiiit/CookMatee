import { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import { earningAPI, getImageUrl } from '../lib/api';
import { TrendingUp, DollarSign, PieChart, Calendar, ChevronRight } from 'lucide-react';

export default function Earnings() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await earningAPI.getStats();
            setStats(res.data);
            if (res.data.recipes?.length > 0) {
                setSelectedRecipe(res.data.recipes[0]);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#121212]">
            <Navbar activePage="earnings" />
            
            <div className="max-w-[1440px] mx-auto flex h-[calc(100vh-80px)] overflow-hidden">
                {/* Left Sidebar - Premium Recipes */}
                <div className="w-[350px] bg-white dark:bg-[#1a1a1a] border-r border-gray-100 dark:border-gray-800 flex flex-col h-full shadow-sm">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-xl font-bold dark:text-white mb-1">My Premium Recipes</h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold">Track your content performance</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {!stats?.recipes?.length ? (
                            <div className="p-8 text-center text-gray-400">
                                <PieChart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No premium recipes yet</p>
                            </div>
                        ) : (
                            stats.recipes.map((recipe) => (
                                <button
                                    key={recipe._id}
                                    onClick={() => setSelectedRecipe(recipe)}
                                    className={`w-full p-4 flex items-center space-x-4 border-b border-gray-50 dark:border-gray-800 transition-all group ${
                                        selectedRecipe?._id === recipe._id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                                        <img 
                                            src={getImageUrl(recipe.image)} 
                                            alt={recipe.title} 
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                                        />
                                        {recipe.salesCount > 0 && (
                                            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-1 rounded-bl-lg font-bold">
                                                +{recipe.salesCount}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <h3 className={`font-bold truncate ${selectedRecipe?._id === recipe._id ? 'text-primary' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {recipe.title}
                                        </h3>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Rs. {recipe.revenue.toLocaleString()}</span>
                                            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500">{recipe.salesCount} sales</span>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform ${selectedRecipe?._id === recipe._id ? 'text-primary' : ''}`} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Header: Total Balance & Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Balance Card */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between relative overflow-hidden group">
                           <div>
                                <p className="text-gray-400 dark:text-gray-500 font-medium tracking-wide">Available Balance</p>
                                <div className="flex items-baseline space-x-2 mt-2">
                                    <span className="text-5xl font-extrabold dark:text-white tracking-tighter">Rs. {stats?.totalBalance?.toLocaleString()}</span>
                                    {stats?.totalBalance > 0 && (
                                        <span className="text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full text-xs flex items-center">
                                            <TrendingUp className="w-3 h-3 mr-1" /> +12.5
                                        </span>
                                    )}
                                </div>
                           </div>

                           <div className="mt-12">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400 flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" /> Last 7 Days
                                        </p>
                                        <h4 className="font-bold text-gray-700 dark:text-gray-200">Weekly Performance</h4>
                                    </div>
                                </div>
                                <svg className="w-full h-32 overflow-visible" viewBox="0 0 400 100">
                                    <defs>
                                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" style={{stopColor: '#ff4d4d', stopOpacity: 0.2}} />
                                            <stop offset="100%" style={{stopColor: '#ff4d4d', stopOpacity: 0}} />
                                        </linearGradient>
                                    </defs>
                                    {(() => {
                                        const data = stats?.weeklyData || [0, 0, 0, 0, 0, 0, 0];
                                        const max = Math.max(...data, 100);
                                        const points = data.map((val, i) => ({
                                            x: (i * 400) / (data.length - 1),
                                            y: 100 - (val / max) * 90
                                        }));
                                        
                                        let d = `M${points[0].x},${points[0].y}`;
                                        for (let i = 0; i < points.length - 1; i++) {
                                            const curr = points[i];
                                            const next = points[i+1];
                                            const midX = (curr.x + next.x) / 2;
                                            d += ` C${midX},${curr.y} ${midX},${next.y} ${next.x},${next.y}`;
                                        }

                                        const todayVal = data[data.length - 1];
                                        const lastPoint = points[points.length - 1];

                                        return (
                                            <>
                                                <path d={d} fill="none" stroke="#ff4d4d" strokeWidth="4" strokeLinecap="round" />
                                                <path d={`${d} V100 H0 Z`} fill="url(#grad)" />
                                                {points.map((p, i) => (i % 2 === 0 || i === points.length - 1) && (
                                                    <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 6 : 4} fill="#ff4d4d" stroke={i === points.length - 1 ? "#fff" : "none"} strokeWidth={2} />
                                                ))}
                                                <text x={lastPoint.x} y={lastPoint.y - 15} textAnchor="end" className="text-[12px] font-black fill-primary">
                                                    Rs. {todayVal.toLocaleString()} Today
                                                </text>
                                            </>
                                        );
                                    })()}
                                </svg>
                                <div className="flex justify-between mt-4 px-1">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                                        <span key={day} className="text-[10px] text-gray-400 font-bold uppercase">{day}</span>
                                    ))}
                                </div>
                           </div>
                        </div>

                        {/* Breakdown Chart card */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-xl font-bold dark:text-white">Recipe Distribution</h3>
                                    <p className="text-sm text-gray-400">Revenue share by premium content</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                                    <PieChart className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-12">
                                <div className="relative w-40 h-40 flex-shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                                        {(() => {
                                            let total = stats?.totalBalance || 1;
                                            let offset = 0;
                                            const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
                                            return (stats?.recipes || []).slice(0, 5).map((r, i) => {
                                                const percent = (r.revenue / total) * 100;
                                                const dash = `${percent} 100`;
                                                const currentOffset = offset;
                                                offset -= percent;
                                                return (
                                                    <circle 
                                                        key={r._id} 
                                                        cx="18" cy="18" r="15.9" 
                                                        fill="transparent" 
                                                        stroke={colors[i % colors.length]} 
                                                        strokeWidth="4" 
                                                        strokeDasharray={dash} 
                                                        strokeDashoffset={currentOffset} 
                                                    />
                                                );
                                            });
                                        })()}
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-black dark:text-white">
                                            {stats?.recipes?.length > 0 ? (Math.max(...stats.recipes.map(r => (r.revenue / (stats.totalBalance || 1)) * 100)).toFixed(0)) : 0}%
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Top Recipe</span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {(stats?.recipes || []).slice(0, 5).map((recipe, idx) => {
                                        const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
                                        const percent = stats?.totalBalance > 0 ? ((recipe.revenue / stats.totalBalance) * 100).toFixed(1) : 0;
                                        return (
                                            <div key={recipe._id} className="flex items-center justify-between group cursor-pointer" onClick={() => setSelectedRecipe(recipe)}>
                                                <div className="flex items-center space-x-3 min-w-0">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: colors[idx % colors.length]}}></div>
                                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate">{recipe.title}</span>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-2">
                                                    <div className="text-xs font-black dark:text-white">Rs. {recipe.revenue.toLocaleString()}</div>
                                                    <div className="text-[10px] text-gray-400">{percent}%</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Replaced Table with Performance Comparison Graph */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-xl font-bold dark:text-white">Monthly Sales Growth</h3>
                                <p className="text-sm text-gray-400">Comparing top recipes across the quarter</p>
                            </div>
                        </div>
                        
                        <div className="h-64 mt-8 relative flex items-end justify-between px-4">
                            {/* Simple Bar Chart Visualization */}
                            {(stats?.recipes || []).slice(0, 7).map((recipe, i) => {
                                const height = Math.max(15, (recipe.revenue / (Math.max(...stats.recipes.map(r => r.revenue)) || 1)) * 100);
                                const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#6366f1'];
                                return (
                                    <div key={recipe._id} className="flex flex-col items-center space-y-4 group relative h-full justify-end" style={{width: `${100 / 8}%`}}>
                                        <div className="relative w-full flex justify-center">
                                            {/* Tooltip */}
                                            <div className="absolute -top-12 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                                                Rs. {recipe.revenue.toLocaleString()}
                                            </div>
                                            {/* Bar */}
                                            <div 
                                                className="w-8 sm:w-12 rounded-t-xl transition-all duration-1000 group-hover:brightness-110 shadow-lg relative overflow-hidden" 
                                                style={{ 
                                                    height: `${height}%`, 
                                                    backgroundColor: colors[i % colors.length],
                                                    opacity: selectedRecipe?._id === recipe._id ? 1 : 0.7
                                                }}
                                            >
                                                <div className="absolute top-0 left-0 w-full h-1/3 bg-white dark:bg-[#1a1a1a]/20"></div>
                                            </div>
                                        </div>
                                        <div className="text-center w-full px-1">
                                            <p className="text-[10px] font-black dark:text-gray-300 truncate">{recipe.title}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase">{recipe.salesCount} Sales</p>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* X-Axis line */}
                            <div className="absolute bottom-[44px] left-0 w-full h-px bg-gray-100 dark:border-gray-800"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
