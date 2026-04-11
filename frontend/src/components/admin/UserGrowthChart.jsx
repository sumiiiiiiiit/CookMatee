import React from 'react';
import { TrendingUp } from 'lucide-react';

const UserGrowthChart = ({ users = [] }) => {
    // 1. Process users to get counts for the last 6 months
    const now = new Date();
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return {
            month: d.toLocaleString('default', { month: 'short' }),
            numMonth: d.getMonth() + 1,
            year: d.getFullYear(),
            count: 0
        };
    }).reverse();

    users.forEach(u => {
        if (!u.createdAt) return;
        const uDate = new Date(u.createdAt);
        const match = last6Months.find(m => 
            m.numMonth === (uDate.getMonth() + 1) && 
            m.year === uDate.getFullYear()
        );
        if (match) match.count++;
    });

    // 2. SVG Spline logic
    const data = last6Months.map(m => m.count);
    const maxVal = Math.max(...data, 5); 
    const width = 800;
    const height = 280;
    const paddingX = 60;
    const paddingY = 40;
    
    // Generate points for SVG
    const points = data.map((val, i) => ({
        x: paddingX + (i * (width - 2 * paddingX)) / (data.length - 1),
        y: height - paddingY - (val / maxVal) * (height - 2 * paddingY)
    }));

    // Generate path for smooth spline (Cubic Bezier)
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const cp1x = curr.x + (next.x - curr.x) / 2;
        d += ` C ${cp1x} ${curr.y}, ${cp1x} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaPath = `${d} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return (
        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm mt-8 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h4 className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xl tracking-tight">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                            <TrendingUp size={22} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        User Growth (Last 6 Months)
                    </h4>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Monthly acquisition insights and trends</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></span> New Users
                    </div>
                </div>
            </div>
            
            <div className="relative w-full overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                    {/* Y-Axis Grid Lines */}
                    {[0, 0.5, 1].map(v => (
                        <g key={v}>
                            <line 
                                x1={paddingX} 
                                y1={paddingY + v * (height - 2 * paddingY)} 
                                x2={width - paddingX} 
                                y2={paddingY + v * (height - 2 * paddingY)} 
                                stroke="currentColor" 
                                className="text-gray-100 dark:text-gray-800/40" 
                                strokeWidth="1"
                            />
                            <text 
                                x={paddingX - 15} 
                                y={paddingY + v * (height - 2 * paddingY) + 4} 
                                textAnchor="end" 
                                className="text-[10px] fill-gray-400 font-bold tabular-nums"
                            >
                                {Math.round(maxVal * (1 - v))}
                            </text>
                        </g>
                    ))}
                    
                    {/* Area Gradient Defs */}
                    <defs>
                        <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>
                    
                    {/* The Chart */}
                    <path d={areaPath} fill="url(#growthGradient)" />
                    <path 
                        d={d} 
                        fill="none" 
                        stroke="#8b5cf6" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="drop-shadow-[0_4px_10px_rgba(139,92,246,0.3)]"
                    />
                    
                    {/* Data Points */}
                    {points.map((p, i) => (
                        <circle 
                            key={i} 
                            cx={p.x} 
                            cy={p.y} 
                            r="6" 
                            fill="white" 
                            stroke="#8b5cf6" 
                            strokeWidth="3" 
                            className="cursor-pointer transition-transform hover:scale-125" 
                        />
                    ))}
                    
                    {/* X-Axis Labels */}
                    {last6Months.map((m, i) => (
                        <text 
                            key={i} 
                            x={points[i].x} 
                            y={height - 10} 
                            textAnchor="middle" 
                            className="text-[11px] fill-gray-400 font-bold uppercase tracking-tighter"
                        >
                            {m.month}
                        </text>
                    ))}
                </svg>
            </div>
        </div>
    );
};

export default UserGrowthChart;
