import React, { useState, useEffect, useRef } from 'react';
import { recipeAPI } from '../lib/api';

export default function RecipeSearchBar({ onSearchComplete }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        
        const fetchSuggestions = async () => {
            if (!showDropdown) return;
            
            setIsSearching(true);
            try {
                const res = await recipeAPI.searchRecipes(searchTerm);
                if (res.data.success && isMounted) {
                    setSuggestions(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch suggestions:", err);
            } finally {
                if (isMounted) setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchSuggestions();
            setSelectedIndex(-1);
        }, 150);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [searchTerm, showDropdown]);

    // Handle clicks outside the component to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (!showDropdown || suggestions.length === 0) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSelect(searchTerm);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                handleSelect(suggestions[selectedIndex].name);
            } else if (searchTerm) {
                handleSelect(searchTerm);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowDropdown(false);
            inputRef.current?.blur();
        }
    };

    const handleSelect = (name) => {
        const targetSearch = name || '';
        setSearchTerm(targetSearch);
        setShowDropdown(false);
        if (onSearchComplete) {
            onSearchComplete(targetSearch);
        }
    };

    return (
        <div className="relative w-full md:w-96 group z-50" ref={dropdownRef}>
            <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search recipes..."
                className="w-full pl-12 pr-10 py-3 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            
            {searchTerm && (
                <button
                    onClick={() => handleSelect('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
            
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 transition-colors">
                    <div className="p-3 bg-gray-50/50 dark:bg-black/20 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-2">
                            {searchTerm.trim() === '' ? 'Trending Recipes' : 'AI Suggestions'}
                        </span>
                        {isSearching && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto py-2">
                        {suggestions.length > 0 ? (
                            suggestions.map((result, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(result.name)}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                    className={`w-full px-5 py-3 flex items-center justify-between group transition-colors text-left ${selectedIndex === i ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-primary/5 dark:hover:bg-primary/10'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${selectedIndex === i ? 'bg-primary/20 text-primary' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-primary/10 dark:group-hover:bg-primary/20 group-hover:text-primary'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{result.name}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : !isSearching && (
                            <div className="px-5 py-4 text-gray-400 text-xs italic">No matching suggestions found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
