import React from 'react';
import { Users, UserCheck, ShieldCheck, BookOpen, Activity, Star } from 'lucide-react';

const AdminStats = ({ activeTab, users, recipes }) => {
    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const regularUsers = totalUsers - adminUsers;

    const totalRecipes = recipes.length;
    const activeRecipes = recipes.filter(r => r.status === 'approved').length;
    const premiumRecipes = recipes.filter(r => r.isPremium).length;

    const getChartData = (type) => {
        const total = type === 'recipes' ? totalRecipes : totalUsers;
        if (!total) return [];
        
        let segments = [];
        if (type === 'recipes') {
            segments = [
                { label: 'Free (Active)', value: recipes.filter(r => !r.isPremium && r.status === 'approved').length, color: '#10b981' },
                { label: 'Premium', value: recipes.filter(r => r.isPremium && r.status === 'approved').length, color: '#f59e0b' },
                { label: 'Hold', value: recipes.filter(r => r.status === 'rejected').length, color: '#ef4444' },
                { label: 'Pending', value: recipes.filter(r => r.status === 'pending').length, color: '#3b82f6' }
            ];
        } else {
            segments = [
                { label: 'Standard Users', value: regularUsers, color: '#3b82f6' },
                { label: 'Admins', value: adminUsers, color: '#8b5cf6' }
            ];
        }

        segments = segments.filter(d => d.value > 0);
        let offset = 0;
        return segments.map(d => {
            const percent = (d.value / total) * 100;
            const res = { ...d, dash: `${percent} 100`, offset, percent: percent.toFixed(1) };
            offset -= percent;
            return res;
        });
    };

    const getMonthlyUsers = () => {
        if (!users.length) return [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const count = users.filter(u => {
                const created = new Date(u.createdAt);
                return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
            }).length;
            data.push({ label: months[d.getMonth()], count });
        }
        return data;
    };

    const monthlyGrowthData = getMonthlyUsers();
    const maxGrowth = Math.max(...monthlyGrowthData.map(d => d.count), 5);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 content-start">
                {activeTab === 'users' ? (
                    <>
                        <StatCard icon={<Users size={28}/>} label="Total Users" val={totalUsers} bg="blue" col="col-span-2" />
                        <StatCard icon={<UserCheck size={28}/>} label="Standard Users" val={regularUsers} bg="green" />
                        <StatCard icon={<ShieldCheck size={28}/>} label="Administrators" val={adminUsers} bg="purple" />
                    </>
                ) : (
                    <>
                        <StatCard icon={<BookOpen size={28}/>} label="Total Recipes" val={totalRecipes} bg="gray" col="col-span-2" />
                        <StatCard icon={<Activity size={28}/>} label="Active Recipes" val={activeRecipes} bg="green" />
                        <StatCard icon={<Star size={28}/>} label="Premium Content" val={premiumRecipes} bg="amber" />
                    </>
                )}
            </div>

            <div className="lg:col-span-1 bg-white dark:bg-[#1a1a1a] p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center relative overflow-hidden">
                {activeTab === 'users' ? (
                    <GrowthChart data={monthlyGrowthData} max={maxGrowth} />
                ) : (
                    <DistributionChart total={totalRecipes} data={getChartData('recipes')} />
                )}
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, val, bg, col }) => (
    <div className={`bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-6 ${col || ''}`}>
        <div className={`w-16 h-16 bg-${bg}-50 dark:bg-${bg}-900/20 text-${bg}-500 rounded-full flex items-center justify-center shrink-0`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm font-bold uppercase mb-1">{label}</p>
            <h3 className="text-4xl font-extrabold dark:text-white tracking-tighter">{val}</h3>
        </div>
    </div>
);

const GrowthChart = ({ data, max }) => (
    <div className="w-full h-full flex flex-col">
        <h3 className="text-lg font-bold dark:text-white mb-6">User Growth</h3>
        <div className="flex-1 relative min-h-[200px]">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="growthGradSidebar" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.2 }} />
                        <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                    </linearGradient>
                </defs>
                {(() => {
                    const points = data.map((d, i) => ({ x: (i * 400) / (data.length - 1), y: 200 - (d.count / max) * 140 - 30 }));
                    let dStr = `M${points[0].x},${points[0].y}`;
                    for (let i = 0; i < points.length - 1; i++) {
                        const midX = (points[i].x + points[i+1].x) / 2;
                        dStr += ` C${midX},${points[i].y} ${midX},${points[i+1].y} ${points[i+1].x},${points[i+1].y}`;
                    }
                    return (
                        <>
                            <path d={`${dStr} V200 H0 Z`} fill="url(#growthGradSidebar)" />
                            <path d={dStr} fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
                            {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />)}
                        </>
                    );
                })()}
            </svg>
        </div>
        <div className="flex justify-between mt-4">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{d.label}</span>
                    <span className="text-[10px] font-bold text-primary">{d.count}</span>
                </div>
            ))}
        </div>
    </div>
);

const DistributionChart = ({ total, data }) => (
    <>
        <h3 className="w-full text-lg font-bold dark:text-white mb-6 text-left absolute top-6 left-6">Distribution</h3>
        <div className="relative w-40 h-40 mt-6 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f1f5f9" className="dark:stroke-gray-800" strokeWidth="4" />
                {data.map((segment, i) => (
                    <circle key={i} cx="18" cy="18" r="15.9" fill="transparent" stroke={segment.color} strokeWidth="4" strokeDasharray={segment.dash} strokeDashoffset={segment.offset} className="transition-all duration-1000" />
                ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black dark:text-white">{total}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
            </div>
        </div>
        <div className="mt-8 w-full space-y-3">
            {data.map((segment, idx) => (
                <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: segment.color}}></div>
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{segment.label}</span>
                    </div>
                    <span className="text-xs font-black dark:text-white bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">{segment.value}</span>
                </div>
            ))}
        </div>
    </>
);

export default AdminStats;
