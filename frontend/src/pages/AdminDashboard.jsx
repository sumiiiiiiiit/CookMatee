import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from 'lib/api';
import logo from '../assets/logo.png';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' or 'users'
    const [recipes, setRecipes] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingRecipe, setDeletingRecipe] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'recipes') {
                const response = await adminAPI.getRecipes();
                setRecipes(response.data.recipes);
            } else {
                const response = await adminAPI.getUsers();
                setUsers(response.data.users);
            }
        } catch (error) {
            console.error('Fetch data error:', error);
            if (error.response?.status === 403) {
                alert('Access denied. Admin only.');
                navigate('/home');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await adminAPI.updateRecipeStatus(id, status);
            fetchData();
        } catch (error) {
            alert('Failed to update status');
        }
    };



    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await adminAPI.deleteUser(id);
            fetchData();
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    const handleDeleteWithReason = async (e) => {
        e.preventDefault();
        if (!deleteReason.trim()) return;
        setIsDeleting(true);
        try {
            // 1. Notify the user first
            await adminAPI.notifyUser(deletingRecipe._id, `This recipe has been deleted. Reason: ${deleteReason}`);

            // 2. Delete the recipe
            await adminAPI.deleteRecipe(deletingRecipe._id);

            alert('Recipe deleted and author notified.');
            setDeletingRecipe(null);
            setDeleteReason('');
            fetchData();
        } catch (error) {
            console.error('Delete/Notify error:', error);
            alert('Failed to delete recipe. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
            {/* Admin Navbar */}
            <nav className="bg-white px-8 py-4 flex justify-between items-center shadow-sm relative z-50">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/home')}>
                    <img src={logo} alt="CookMate Logo" className="h-10 w-auto" />
                    <span className="font-bold text-lg tracking-tight text-gray-800">ADMIN PANEL</span>
                </div>
                <button
                    onClick={() => navigate('/home')}
                    className="text-primary hover:underline font-semibold"
                >
                    Back to Site
                </button>
            </nav>

            <div className="flex-grow p-8 max-w-7xl mx-auto w-full">
                <div className="flex space-x-4 mb-8">
                    <button
                        onClick={() => setActiveTab('recipes')}
                        className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'recipes' ? 'bg-primary text-white' : 'bg-white text-gray-500 border'}`}
                    >
                        Manage Recipes
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'users' ? 'bg-primary text-white' : 'bg-white text-gray-500 border'}`}
                    >
                        Manage Users
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : activeTab === 'recipes' ? (
                    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-700">Recipe</th>
                                    <th className="px-6 py-4 font-bold text-gray-700">Author</th>
                                    <th className="px-6 py-4 font-bold text-gray-700">Status</th>
                                    <th className="px-6 py-4 font-bold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {recipes.length > 0 ? recipes.map(recipe => (
                                    <tr key={recipe._id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-800">{recipe.title}</div>
                                            <div className="text-xs text-gray-400 uppercase">{recipe.category}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">Chef {recipe.chefName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${recipe.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                recipe.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {recipe.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => navigate(`/recipes/${recipe._id}`)}
                                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center"
                                                >
                                                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    View
                                                </button>

                                                {recipe.status !== 'approved' ? (
                                                    <button
                                                        onClick={() => handleUpdateStatus(recipe._id, 'approved')}
                                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                                                    >
                                                        <div className="flex items-center">
                                                            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                            Accept
                                                        </div>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpdateStatus(recipe._id, 'rejected')}
                                                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                                                    >
                                                        <div className="flex items-center">
                                                            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 9v6m4-6v6" /></svg>
                                                            Put on Hold
                                                        </div>
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setDeletingRecipe(recipe)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-gray-500">No recipes found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-700">User</th>
                                    <th className="px-6 py-4 font-bold text-gray-700">Email</th>
                                    <th className="px-6 py-4 font-bold text-gray-700">Role</th>
                                    <th className="px-6 py-4 font-bold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {users.map(u => (
                                    <tr key={u._id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 font-semibold text-gray-800">{u.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(u._id)}
                                                    className="text-red-500 hover:underline font-bold text-sm"
                                                >
                                                    Delete User
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation & Reason Modal */}
            {deletingRecipe && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setDeletingRecipe(null)}></div>
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-extrabold text-[#1a1a1a]">Delete Recipe</h2>
                                <p className="text-gray-400 text-sm font-medium mt-1">Please provide a reason to notify Chef {deletingRecipe.chefName}</p>
                            </div>
                            <button onClick={() => setDeletingRecipe(null)} className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-white rounded-full shadow-sm">✕</button>
                        </div>

                        <form onSubmit={handleDeleteWithReason} className="p-10 space-y-6">
                            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                                <span className="text-red-600 text-xs font-bold uppercase tracking-wider block mb-1">Deleting:</span>
                                <span className="font-bold text-red-900">{deletingRecipe.title}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Reason for Deletion</label>
                                <textarea
                                    required
                                    rows="5"
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder="Explain why this recipe is being removed (e.g. inappropriate content, duplicate, etc.)..."
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none font-medium text-gray-900"
                                ></textarea>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setDeletingRecipe(null)}
                                    className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-[24px] font-bold transition-all"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeleting || !deleteReason.trim()}
                                    className="flex-[2] py-4 bg-red-600 hover:bg-red-700 text-white rounded-[24px] font-bold shadow-xl shadow-red-100 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Deleting...</span></>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            <span>Delete & Notify</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
