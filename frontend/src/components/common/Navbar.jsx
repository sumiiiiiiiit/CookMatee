import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { authAPI } from 'lib/api';
import logo from '../../assets/logo.png';

export default function Navbar({ activePage, user: propUser }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(propUser || null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const menuRef = useRef(null);

    useEffect(() => {
        if (propUser) { setUser(propUser); return; }
        authAPI.getProfile()
            .then(r => setUser(r.data.user || r.data))
            .catch(() => setUser(null));
    }, [propUser]);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowProfileMenu(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            Cookies.remove('isLoggedIn');
            setUser(null);
            navigate('/login');
        } catch (e) {
            console.error('Logout failed:', e);
        }
    };

    const navItems = [
        { name: 'Home', path: '/home' },
        { name: 'Recipes', path: '/recipes' },
        { name: 'About us', path: '/about' },
    ];

    return (
        <nav className="bg-white dark:bg-[#1a1a1a] px-6 py-4 flex justify-between items-center shadow-sm relative z-[100] border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/home')}>
                <img src={logo} alt="CookMate Logo" className="h-12 w-auto" />
                <span className="font-bold text-lg tracking-tight text-gray-800 dark:text-white uppercase transition-colors">COOKMATE</span>
            </div>

            {/* Nav links + actions */}
            <div className="flex items-center space-x-8 text-sm font-medium text-gray-700 dark:text-gray-300">
                {navItems.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => navigate(item.path)}
                        className={`${activePage === item.name.toLowerCase() || (activePage === 'about' && item.name === 'About us')
                            ? 'text-primary font-bold'
                            : 'hover:text-primary'
                            } transition`}
                    >
                        {item.name}
                    </button>
                ))}

                {/* Theme Toggle */}
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-primary transition-all shadow-sm"
                    aria-label="Toggle Theme"
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {darkMode ? (
                        <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                    )}
                </button>

                {/* Chat icon → navigates to full Messages page */}
                {user && (
                    <button
                        onClick={() => navigate('/messages')}
                        className={`relative w-10 h-10 flex items-center justify-center rounded-2xl transition-all
                            ${activePage === 'messages'
                                ? 'bg-violet-100 text-violet-600'
                                : 'hover:bg-gray-100 text-gray-500 hover:text-violet-600'}`}
                        aria-label="Messages"
                        title="Messages"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </button>
                )}

                {/* Profile menu */}
                {user ? (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg hover:bg-secondary transition-colors uppercase"
                        >
                            {user?.name?.[0]}
                        </button>

                        {showProfileMenu && (
                            <div className="saas-dropdown right-0 w-72 bg-white dark:bg-[#252525] border border-gray-100 dark:border-gray-800 shadow-2xl transition-colors duration-300">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center text-3xl font-bold mb-3 uppercase text-white shadow-lg">
                                        {user?.name?.[0]}
                                    </div>
                                    <h3 className="text-xl font-semibold dark:text-white">{user?.name}</h3>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm">{user?.email}</p>
                                </div>

                                <div className="space-y-1">
                                        <button
                                            onClick={() => { setShowProfileMenu(false); navigate('/dashboard'); }}
                                            className="dropdown-item justify-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full px-4 py-2 rounded-xl"
                                        >
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="dark:text-gray-300 font-medium">Edit Profile</span>
                                        </button>

                                        <button
                                            onClick={() => { setShowProfileMenu(false); navigate('/earnings'); }}
                                            className="dropdown-item justify-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full px-4 py-2 rounded-xl"
                                        >
                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="dark:text-gray-300 font-medium">Earnings</span>
                                        </button>

                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={() => { setShowProfileMenu(false); navigate('/admin'); }}
                                            className="dropdown-item justify-start space-x-3 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors w-full px-4 py-2 rounded-xl"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            <span className="font-medium">Admin Panel</span>
                                        </button>
                                    )}

                                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2" />
                                    <button
                                        onClick={handleLogout}
                                        className="dropdown-item justify-start space-x-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full px-4 py-2 rounded-xl group"
                                    >
                                        <svg className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span className="text-red-500 font-bold">Log out</span>
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
