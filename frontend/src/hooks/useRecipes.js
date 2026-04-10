import { useState, useEffect } from 'react';
import { authAPI, recipeAPI } from '../lib/api';

export const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert'];
export const QUICK_FILTERS = [
    { id: 'under30', label: 'Under 30 min' },
    { id: 'veg', label: 'Vegetarian' },
    { id: 'highProtein', label: 'High Protein' },
    { id: 'lowCalorie', label: 'Low Calorie' },
];

export default function useRecipes() {
    const [user, setUser] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [quickFilter, setQuickFilter] = useState(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prof, recs] = await Promise.allSettled([authAPI.getProfile(), recipeAPI.getAll()]);
                if (prof.status === 'fulfilled') setUser(prof.value.data.user || prof.value.data);
                if (recs.status === 'fulfilled') setRecipes(recs.value.data.recipes);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    useEffect(() => { setCurrentPage(1); }, [selectedCategory, searchTerm, quickFilter, showAll]);

    const filtered = recipes.filter(r => {
        if (selectedCategory && r.category !== selectedCategory) return false;
        if (searchTerm && !r.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (quickFilter === 'under30') return (parseInt(r.cookingTime) || 0) <= 30;
        if (quickFilter === 'veg') {
            const txt = (r.title + ' ' + (r.ingredients?.map(i => i.name).join(' ') || '')).toLowerCase();
            return !['chicken', 'beef', 'meat', 'pork', 'mutton', 'fish', 'prawn', 'shrimp'].some(m => txt.includes(m));
        }
        if (quickFilter === 'highProtein') return (r.protein || 0) >= 20;
        if (quickFilter === 'lowCalorie') return (r.calories || 0) > 0 && (r.calories || 0) <= 400;
        return true;
    });

    const latest = [...recipes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
    const popular = [...recipes].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 4);

    return {
        user, recipes, loading, selectedCategory, setSelectedCategory,
        searchTerm, setSearchTerm, currentPage, setCurrentPage,
        quickFilter, setQuickFilter, showAll, setShowAll,
        filtered, latest, popular,
        isFiltered: selectedCategory !== null || searchTerm.trim() !== '' || quickFilter !== null || showAll,
        totalPages: Math.ceil(filtered.length / 8),
        currentRecipes: filtered.slice((currentPage - 1) * 8, currentPage * 8),
        clearAll: () => { setSelectedCategory(null); setSearchTerm(''); setQuickFilter(null); setShowAll(false); }
    };
}
