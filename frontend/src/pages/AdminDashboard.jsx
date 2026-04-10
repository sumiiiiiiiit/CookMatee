import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from 'lib/api';
import logo from '../assets/logo.png';
import AdminRecipesTab from '../components/admin/AdminRecipesTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' or 'users'
    const [recipes, setRecipes] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
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

    const handleDeleteRecipe = async (recipe, reason) => {
        setIsDeleting(true);
        try {
            await adminAPI.notifyUser(recipe._id, `This recipe has been deleted. Reason: ${reason}`);
            await adminAPI.deleteRecipe(recipe._id);
            alert('Recipe deleted and author notified.');
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
                    <AdminRecipesTab 
                        recipes={recipes} 
                        navigate={navigate} 
                        onUpdateStatus={handleUpdateStatus} 
                        onDeleteRecipe={handleDeleteRecipe} 
                        isDeleting={isDeleting} 
                    />
                ) : (
                    <AdminUsersTab users={users} onDeleteUser={handleDeleteUser} />
                )}
            </div>
        </div>
    );
}
