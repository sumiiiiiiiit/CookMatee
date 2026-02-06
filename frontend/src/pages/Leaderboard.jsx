import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipeAPI } from 'lib/api';
import Navbar from '../components/Navbar';

export default function Leaderboard() {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await recipeAPI.getLeaderboard();
                setLeaderboard(res.data.leaderboard);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
            <Navbar activePage="recipes" />

            <main className="flex-grow flex flex-col items-center pt-12 pb-20 px-4">
                <div className="text-center mb-8 max-w-2xl">
                    <h1 className="text-[32px] font-extrabold text-[#1a1a1a] mb-2 tracking-tight">
                        Most Liked Recipe Leaderboard
                    </h1>
                    <p className="text-gray-500 text-base">
                        Discover the most popular recipes making waves in the culinary world, ranked by the number of likes from our community.
                    </p>
                </div>

                <div className="bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 w-full max-w-5xl overflow-hidden p-12 mb-12">
                    <h2 className="text-[22px] font-bold text-[#1a1a1a] mb-10 px-2">Top Recipe Rankings</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-400 text-[10px] font-extrabold uppercase tracking-[0.1em] border-b border-gray-50">
                                    <th className="px-6 py-4 font-black">Rank</th>
                                    <th className="px-6 py-4 font-black">Recipe</th>
                                    <th className="px-6 py-4 font-black text-center">Likes</th>
                                    <th className="px-6 py-4 font-black text-right">Category</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-8"><div className="h-4 w-4 bg-gray-50 rounded"></div></td>
                                            <td className="px-6 py-8"><div className="h-4 w-32 bg-gray-50 rounded"></div></td>
                                            <td className="px-6 py-8"><div className="h-4 w-8 bg-gray-50 mx-auto rounded"></div></td>
                                            <td className="px-6 py-8"><div className="h-4 w-24 bg-gray-50 ml-auto rounded"></div></td>
                                        </tr>
                                    ))
                                ) : leaderboard.length > 0 ? (
                                    leaderboard.map((entry, index) => (
                                        <tr
                                            key={entry._id}
                                            onClick={() => navigate(`/recipes/${entry._id}`)}
                                            className={`${index % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'} hover:bg-gray-50 transition-colors group cursor-pointer`}
                                        >
                                            <td className="px-6 py-8 font-bold text-[#1a1a1a]">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#1a1a1a] group-hover:text-primary transition-colors text-base">
                                                        {entry.title}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        by {entry.chefName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-center">
                                                <div className="flex items-center justify-center gap-2 text-primary">
                                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                    <span className="font-bold">{entry.likesCount}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-right">
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                                    {entry.category}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-24 text-center text-gray-400 font-medium text-sm">
                                            No rankings available yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <button
                    onClick={() => navigate(-1)}
                    className="px-12 py-3 bg-white border border-gray-200 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition shadow-sm text-sm"
                >
                    Back
                </button>
            </main>
        </div>
    );
}
