import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { authAPI } from 'lib/api';
import logo from '../assets/logo.png';

export default function Navbar({ activePage, user: propUser }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(propUser || null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showChatMenu, setShowChatMenu] = useState(false);
    const menuRef = useRef(null);
    const chatMenuRef = useRef(null);

    useEffect(() => {
        if (propUser) {
            setUser(propUser);
            return;
        }

        const fetchProfile = async () => {
            try {
                const response = await authAPI.getProfile();
                setUser(response.data.user || response.data);
            } catch (error) {
                setUser(null);
            }
        };
        fetchProfile();
    }, [propUser]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
            if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
                setShowChatMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            Cookies.remove('token');
            setUser(null);
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const navItems = [
        { name: 'Home', path: '/home' },
        { name: 'Recipes', path: '/recipes' },
        { name: 'Chat', path: '/chatbot' },
        { name: 'About us', path: '/about' },
    ];

    return (
        <nav className="bg-white px-6 py-4 flex justify-between items-center shadow-sm relative z-[100]">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/home')}>
                <img src={logo} alt="CookMate Logo" className="h-12 w-auto" />
                <span className="font-bold text-lg tracking-tight text-gray-800 uppercase">COOKMATE</span>
            </div>

            <div className="flex items-center space-x-8 text-sm font-medium text-gray-700">
                {navItems.map((item) => (
                    <div key={item.name} className="relative">
                        <button
                            onClick={() => navigate(item.path)}
                            className={`${activePage === item.name.toLowerCase() || (activePage === 'about' && item.name === 'About us')
                                ? 'text-primary font-bold'
                                : 'hover:text-primary'
                                } transition flex items-center gap-1`}
                        >
                            {item.name}
                        </button>
                    </div>
                ))}

                {user ? (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg hover:bg-secondary transition-colors uppercase"
                        >
                            {user?.name?.[0]}
                        </button>

                        {showProfileMenu && (
                            <div className="saas-dropdown right-0 w-72">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center text-3xl font-bold mb-3 uppercase">
                                        {user?.name?.[0]}
                                    </div>
                                    <h3 className="text-xl font-semibold">{user?.name}</h3>
                                    <p className="text-gray-400 text-sm">{user?.email}</p>
                                </div>

                                <div className="space-y-1">
                                    <button
                                        onClick={() => { setShowProfileMenu(false); navigate('/dashboard'); }}
                                        className="dropdown-item justify-start space-x-3"
                                    >
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <span>View Profile</span>
                                    </button>

                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={() => { setShowProfileMenu(false); navigate('/admin'); }}
                                            className="dropdown-item justify-start space-x-3 text-amber-400"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                            <span>Admin Panel</span>
                                        </button>
                                    )}

                                    <div className="h-px bg-gray-700/50 my-2 mx-2"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="dropdown-item justify-start space-x-3 text-red-100"
                                    >
                                        <svg className="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        <span className="text-[#ff6b6b]">Log out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-xl font-bold transition shadow-md"
                    >
                        Log in
                    </button>
                )}
            </div>
        </nav>
    );
}
