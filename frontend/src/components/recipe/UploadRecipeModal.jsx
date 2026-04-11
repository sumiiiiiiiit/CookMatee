import { useState, useEffect } from 'react';
import { recipeAPI, getImageUrl } from 'lib/api';
import RecipeForm from './RecipeForm';

const UNITS = ['g', 'kg', 'ml', 'L', 'tsp', 'tbsp', 'cup'];

export default function UploadRecipeModal({ onClose, onSuccess, initialData = null }) {
    const [view, setView] = useState(initialData ? 'form' : 'select');
    const [myRecipes, setMyRecipes] = useState([]);
    const [loadingRecipes, setLoadingRecipes] = useState(false);
    const [formData, setFormData] = useState(initialData || {
        title: '',
        category: 'Breakfast',
        ingredients: [{ name: '', quantity: '', unit: 'g' }],
        steps: '',
        difficulty: 3,
        cookingTime: '',
        cookingMethod: [],
        isPremium: false,
        price: '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(initialData?.image || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!initialData) {
            fetchMyRecipes();
        }
    }, [initialData]);

    const fetchMyRecipes = async () => {
        setLoadingRecipes(true);
        try {
            const res = await recipeAPI.getMyRecipes();
            setMyRecipes(res.data.recipes);
            if (res.data.recipes.length === 0) {
                setView('form');
            }
        } catch (err) {
            console.error('Failed to fetch recipes:', err);
            setView('form');
        } finally {
            setLoadingRecipes(false);
        }
    };

    const handleEditExisting = (recipe) => {
        setFormData({
            _id: recipe._id,
            title: recipe.title,
            category: recipe.category,
            ingredients: Array.isArray(recipe.ingredients) 
                ? recipe.ingredients.map(i => {
                    const ing = typeof i === 'string' ? { name: i, quantity: '100' } : i;
                    const qStr = (ing.quantity || '').trim();
                    const qParts = qStr.split(' ');
                    
                    if (qParts.length >= 2) {
                        const val = qParts[0];
                        const unt = qParts[1].toLowerCase();
                        const unitMap = {
                            'grams': 'g', 'gram': 'g',
                            'kilograms': 'kg', 'kilogram': 'kg',
                            'millilitres': 'ml', 'millilitre': 'ml', 'milliliters': 'ml', 'milliliter': 'ml',
                            'litres': 'L', 'litre': 'L', 'liter': 'L', 'liters': 'L', 'l': 'L',
                            'teaspoons': 'tsp', 'teaspoon': 'tsp',
                            'tablespoons': 'tbsp', 'tablespoon': 'tbsp',
                            'cups': 'cup'
                        };
                        const mappedUnit = unitMap[unt] || unt;
                        
                        if (UNITS.includes(mappedUnit)) {
                            return { name: ing.name, quantity: val, unit: mappedUnit };
                        }
                    }
                    
                    return { name: ing.name, quantity: qStr, unit: 'g' };
                })
                : [{ name: '', quantity: '', unit: 'g' }],
            steps: recipe.steps,
            difficulty: recipe.difficulty,
            cookingTime: recipe.cookingTime,
            cookingMethod: Array.isArray(recipe.cookingMethod) ? recipe.cookingMethod : (recipe.cookingMethod ? [recipe.cookingMethod] : []),
            isPremium: recipe.isPremium || false,
            price: recipe.price || '',
        });
        setImagePreview(recipe.image);
        setView('form');
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) return;
        
        setLoading(true);
        setError('');
        try {
            await recipeAPI.delete(formData._id);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete recipe');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('category', formData.category);
            data.append('cookingTime', formData.cookingTime);
            data.append('cookingMethod', JSON.stringify(formData.cookingMethod || []));
            data.append('difficulty', formData.difficulty);
            data.append('steps', formData.steps);
            data.append('isPremium', formData.isPremium);
            data.append('price', formData.isPremium ? formData.price : 0);

            const filteredIngredients = Array.isArray(formData.ingredients)
                ? formData.ingredients
                    .filter(i => i.name.trim())
                    .map(i => {
                        const qty = i.quantity.trim().toLowerCase();
                        const skipAppend = ['to taste', 'as needed', 'to serve', 'for frying'].some(s => qty.includes(s)) ||
                                         !/^\d+/.test(qty) || 
                                         UNITS.some(u => qty.endsWith(u.toLowerCase()));
                        
                        return {
                            name: i.name,
                            quantity: skipAppend ? i.quantity : `${i.quantity} ${i.unit}`
                        };
                    })
                : [];

            data.append('ingredients', JSON.stringify(filteredIngredients));

            if (imageFile) {
                data.append('image', imageFile);
            }

            const recipeId = formData._id || initialData?._id;

            if (recipeId) {
                await recipeAPI.update(recipeId, data);
            } else {
                await recipeAPI.create(data);
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process recipe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-[#121212] flex flex-col animate-in fade-in duration-300 transition-colors">
            <div className="px-12 py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-[#121212] sticky top-0 z-20 transition-colors">
                    <div>
                        <h2 className="text-4xl font-extrabold text-[#1a1a1a] dark:text-white">
                            {view === 'select' ? 'My Recipes' : (formData._id ? 'Edit Recipe' : 'New Recipe')}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-base font-medium mt-2">
                            {view === 'select' ? 'Manage your shared culinary creations' : 'Enter the details of your recipe below'}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all shadow-sm text-2xl">✕</button>
                </div>

                <div className="flex-grow overflow-y-auto p-12 max-w-5xl mx-auto w-full custom-scrollbar transition-colors">
                    {view === 'select' && (
                        <div className="space-y-6">
                            <button
                                onClick={() => setView('form')}
                                className="w-full p-8 rounded-[32px] border-2 border-dashed border-primary/20 dark:border-primary/30 hover:border-primary/50 hover:bg-primary/5 bg-white dark:bg-[#1a1a1a] transition-all group flex items-center space-x-6"
                            >
                                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-gray-800">New Recipe</h3>
                                    <p className="text-gray-500 text-sm">Upload a new recipe to share with the community</p>
                                </div>
                            </button>

                            {loadingRecipes ? (
                                <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                            ) : myRecipes.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 px-2">Edit Your Creations</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {myRecipes.map(recipe => (
                                            <button
                                                key={recipe._id}
                                                onClick={() => handleEditExisting(recipe)}
                                                className="flex items-center space-x-3 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary/30 dark:hover:border-primary/50 hover:shadow-md transition-all text-left bg-gray-50/50 dark:bg-[#1a1a1a] group"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                                    {recipe.image && <img src={recipe.image} className="w-full h-full object-cover" alt="" />}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-200 truncate text-sm group-hover:text-primary transition-colors">{recipe.title}</h4>
                                                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase">{recipe.status}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'form' && (
                        <RecipeForm
                            formData={formData}
                            setFormData={setFormData}
                            imagePreview={imagePreview}
                            imageFile={imageFile}
                            setImageFile={setImageFile}
                            setImagePreview={setImagePreview}
                            onSubmit={handleSubmit}
                            onDelete={handleDelete}
                            onBack={!initialData && !formData._id ? () => setView('select') : null}
                            loading={loading}
                            error={error}
                            initialData={initialData}
                        />
                    )}
                </div>
        </div>
    );
}
