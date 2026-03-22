import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { authAPI } from 'lib/api';
import Navbar from '../components/Navbar';

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [userAllergies, setUserAllergies] = useState([]);
    const [updateLoading, setUpdateLoading] = useState(false);

    const ALLERGEN_OPTIONS = ["milk", "egg", "wheat", "soy", "peanut", "tree_nut", "shellfish", "fish", "sesame"];

    useEffect(() => {
        const fetchProfile = async () => {
            const isAuth = Cookies.get('isLoggedIn') === 'true';
            if (!isAuth) {
                navigate('/login');
                return;
            }

            try {
                const response = await authAPI.getProfile();
                const userData = response.data.user || response.data;
                setUser(userData);
                setNewName(userData.name);
                setUserAllergies(userData.allergies || []);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                Cookies.remove('isLoggedIn');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleUpdateProfile = async () => {
        setUpdateLoading(true);
        try {
            const response = await authAPI.updateProfile({ 
                name: newName,
                allergies: userAllergies 
            });
            const updatedUser = response.data.user;
            setUser({ ...user, name: updatedUser.name, allergies: updatedUser.allergies });
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setUpdateLoading(false);
        }
    };

    const toggleAllergy = (allergy) => {
        if (userAllergies.includes(allergy)) {
            setUserAllergies(userAllergies.filter(a => a !== allergy));
        } else {
            setUserAllergies([...userAllergies, allergy]);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
            <Navbar activePage="profile" user={user} />

            <main className="flex-grow flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl">
                    <div className="bg-gradient-to-r from-primary to-indigo-600 h-32 relative">
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
                                <div className="w-full h-full bg-pink-500 rounded-full flex items-center justify-center text-5xl font-bold text-white uppercase border-4 border-white">
                                    {user?.name?.[0]}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 pb-12 px-8 text-center">
                        <div className="mb-8">
                            {isEditing ? (
                                <div className="flex flex-col items-center space-y-4">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="text-3xl font-bold text-gray-800 text-center border-b-2 border-primary outline-none bg-transparent px-4 py-1"
                                        autoFocus
                                    />
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={updateLoading}
                                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50"
                                        >
                                            {updateLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            onClick={() => { setIsEditing(false); setNewName(user.name); }}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-bold transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="group relative inline-block">
                                    <h1 className="text-4xl font-extrabold text-[#1a1a1a] mb-2">{user?.name}</h1>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="absolute -right-12 top-2 p-2.5 bg-gray-50 text-primary hover:bg-primary hover:text-white rounded-full transition-all shadow-md group-hover:scale-110"
                                        title="Edit Username"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                </div>
                            )}
                            <p className="text-gray-400 font-medium text-lg">{user?.email}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-left max-w-md mx-auto">
                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Account Role</p>
                                    <p className="text-gray-800 font-bold capitalize">{user?.role}</p>
                                </div>
                                <span className={`w-3 h-3 rounded-full ${user?.role === 'admin' ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></span>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">My Allergies</p>
                                    {!isEditing && (
                                        <button 
                                            onClick={() => setIsEditing(true)}
                                            className="text-[10px] font-bold text-primary hover:underline transition"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                                {isEditing ? (
                                    <div className="flex flex-wrap gap-2">
                                        {ALLERGEN_OPTIONS.map(allergy => (
                                            <button
                                                key={allergy}
                                                onClick={() => toggleAllergy(allergy)}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition border ${
                                                    userAllergies.includes(allergy) 
                                                    ? 'bg-primary text-white border-primary shadow-sm' 
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary/50'
                                                }`}
                                            >
                                                {allergy.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {user?.allergies && user.allergies.length > 0 ? (
                                            user.allergies.map(allergy => (
                                                <span key={allergy} className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-bold border border-red-100 uppercase tracking-tighter">
                                                    {allergy.replace('_', ' ')}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-gray-400 text-xs italic">No allergies listed.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Member Since</p>
                                <p className="text-gray-800 font-bold">
                                    {user?.createdAt ? new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
