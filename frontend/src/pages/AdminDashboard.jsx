import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from 'lib/api';
import logo from '../assets/logo.png';
import AdminRecipesTab from '../components/admin/AdminRecipesTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminStats from '../components/admin/AdminStats';
import { ToastContainer, useToast } from '../components/admin/AdminToast';
import { ChefHat, Users, ArrowLeft, RefreshCw, Search } from 'lucide-react';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' or 'users'
    const [recipes, setRecipes] = useState([]);
    const [users, setUsers]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { toasts, toast, dismiss } = useToast();

    useEffect(() => { fetchData(); }, []);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const [recipesRes, usersRes] = await Promise.all([
                adminAPI.getRecipes(),
                adminAPI.getUsers(),
            ]);
            setRecipes(recipesRes.data.recipes);
            setUsers(usersRes.data.users);
            if (isRefresh) toast.success('Data refreshed.');
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error('Access denied. Admin only.');
                navigate('/home');
            } else {
                toast.error('Failed to load data.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await adminAPI.updateRecipeStatus(id, status);
            toast.success(`Recipe ${status === 'approved' ? 'activated' : 'put on hold'}.`);
            fetchData();
        } catch {
            toast.error('Failed to update status.');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await adminAPI.deleteUser(id);
            toast.success('User deleted.');
            fetchData();
        } catch {
            toast.error('Failed to delete user.');
        }
    };

    const handleDeleteRecipe = async (recipe, reason) => {
        setIsDeleting(true);
        try {
            await adminAPI.notifyUser(recipe._id, `Recipe deleted: ${reason}`);
            await adminAPI.deleteRecipe(recipe._id);
            toast.success('Recipe deleted.');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete recipe.');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredRecipes = useMemo(() => {
        return recipes.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [recipes, searchQuery]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [users, searchQuery]);

    return (
        <div className="flex h-screen bg-[#f8f9ff] dark:bg-[#0f0f0f] overflow-hidden">
            {/* ── Sidebar ── */}
            <div className="w-80 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <img src={logo} alt="CookMate" className="h-7 w-auto" />
                        <span className="font-extrabold text-sm text-gray-900 dark:text-white">Admin Panel</span>
                    </div>
                    <button onClick={() => fetchData(true)} disabled={refreshing} className="p-2 text-gray-400 hover:text-primary transition">
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="p-4 space-y-2 flex-grow">
                    <button onClick={() => { setActiveTab('recipes'); setSearchQuery(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'recipes' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        <ChefHat size={18} />
                        Recipes
                    </button>
                    <button onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'users' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        <Users size={18} />
                        Users
                    </button>

                    <div className="pt-4">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition">
                        <ArrowLeft size={14} /> Back to Site
                    </button>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#fbfcff] dark:bg-[#0a0a0a]">
                <div className="max-w-6xl mx-auto space-y-8">
                    {activeTab === 'recipes' && <AdminStats activeTab={activeTab} recipes={recipes} users={users} />}
                    {activeTab === 'users' && <AdminStats activeTab={activeTab} recipes={recipes} users={users} />}

                    <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        {activeTab === 'recipes' ? (
                            <AdminRecipesTab
                                recipes={filteredRecipes}
                                navigate={navigate}
                                onUpdateStatus={handleUpdateStatus}
                                onDeleteRecipe={handleDeleteRecipe}
                                isDeleting={isDeleting}
                            />
                        ) : (
                            <AdminUsersTab users={filteredUsers} onDeleteUser={handleDeleteUser} />
                        )}
                    </div>
                </div>
            </div>

            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </div>
    );
}
