import React from 'react';
import { TrendingUp, Calendar, PieChart } from 'lucide-react';

const EarningsStatsGrid = ({ stats, setSelectedRecipe }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BalanceCard stats={stats} />
            <DistributionCard stats={stats} setSelectedRecipe={setSelectedRecipe} />
        </div>
    );
};

const BalanceCard = ({ stats }) => (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between relative overflow-hidden group">
        <div>
            <p className="text-gray-400 dark:text-gray-500 font-medium tracking-wide">Available Balance</p>
            <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-5xl font-extrabold dark:text-white tracking-tighter">Rs. {stats?.totalBalance?.toLocaleString()}</span>
                {stats?.totalBalance > 0 && <span className="text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full text-xs flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> +12.5%</span>}
            </div>
        </div>
        <div className="mt-12">
            <div className="flex justify-between items-end mb-4">
                <div className="space-y-1"><p className="text-xs text-gray-400 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Last 7 Days</p><h4 className="font-bold text-gray-700 dark:text-gray-200">Weekly Performance</h4></div>
            </div>
            <svg className="w-full h-32 overflow-visible" viewBox="0 0 400 100">
                <defs><linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{stopColor: '#ff4d4d', stopOpacity: 0.2}} /><stop offset="100%" style={{stopColor: '#ff4d4d', stopOpacity: 0}} /></linearGradient></defs>
                {(() => {
                    const data = stats?.weeklyData || [0, 0, 0, 0, 0, 0, 0];
                    const max = Math.max(...data, 100);
                    const points = data.map((val, i) => ({ x: (i * 400) / (data.length - 1), y: 100 - (val / max) * 90 }));
                    let d = `M${points[0].x},${points[0].y}`;
                    for (let i = 0; i < points.length - 1; i++) {
                        const midX = (points[i].x + points[i+1].x) / 2;
                        d += ` C${midX},${points[i].y} ${midX},${points[i+1].y} ${points[i+1].x},${points[i+1].y}`;
                    }
                    return (
                        <>
                            <path d={d} fill="none" stroke="#ff4d4d" strokeWidth="4" strokeLinecap="round" />
                            <path d={`${d} V100 H0 Z`} fill="url(#grad)" />
                            <text x={points[6].x} y={points[6].y - 15} textAnchor="end" className="text-[12px] font-black fill-primary">Rs. {data[6].toLocaleString()} Today</text>
                        </>
                    );
                })()}
            </svg>
            <div className="flex justify-between mt-4 px-1">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="text-[10px] text-gray-400 font-bold uppercase">{day}</span>)}</div>
        </div>
    </div>
);

const DistributionCard = ({ stats, setSelectedRecipe }) => (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-start mb-8">
            <div><h3 className="text-xl font-bold dark:text-white">Recipe Distribution</h3><p className="text-sm text-gray-400">Revenue share</p></div>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl"><PieChart className="w-5 h-5 text-gray-400" /></div>
        </div>
        <div className="flex items-center space-x-12">
            <div className="relative w-40 h-40 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                    {(() => {
                        let total = stats?.totalBalance || 1;
                        let offset = 0;
                        return (stats?.recipes || []).slice(0, 5).map((r, i) => {
                            const percent = (r.revenue / total) * 100;
                            const res = <circle key={r._id} cx="18" cy="18" r="15.9" fill="transparent" stroke={['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'][i%5]} strokeWidth="4" strokeDasharray={`${percent} 100`} strokeDashoffset={offset} />;
                            offset -= percent; return res;
                        });
                    })()}
                </svg>
            </div>
            <div className="flex-1 space-y-3 max-h-48 overflow-y-auto">
                {(stats?.recipes || []).slice(0, 5).map((recipe, idx) => (
                    <div key={recipe._id} className="flex items-center justify-between cursor-pointer" onClick={() => setSelectedRecipe(recipe)}>
                        <div className="flex items-center space-x-3"><div className="w-2 h-2 rounded-full" style={{backgroundColor: ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'][idx%5]}}></div><span className="text-xs font-bold text-gray-600 truncate">{recipe.title}</span></div>
                        <div className="text-right text-xs font-black">Rs. {recipe.revenue.toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default EarningsStatsGrid;
