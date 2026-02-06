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

    const handleDeleteRecipe = async (id) => {
        if (!window.confirm('Are you sure you want to delete this recipe?')) return;
        try {
            await adminAPI.deleteRecipe(id);
            fetchData();
        } catch (error) {
            alert('Failed to delete recipe');
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
                                                    onClick={() => handleDeleteRecipe(recipe._id)}
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
        </div>
    );
}
