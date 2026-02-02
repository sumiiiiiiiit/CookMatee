import { useState, useEffect } from 'react';
import { recipeAPI, getImageUrl } from '@/lib/api';

export default function UploadRecipeModal({ onClose, onSuccess, initialData = null }) {
    const [view, setView] = useState(initialData ? 'form' : 'select');
    const [myRecipes, setMyRecipes] = useState([]);
    const [loadingRecipes, setLoadingRecipes] = useState(false);
    const [formData, setFormData] = useState(initialData || {
        title: '',
        category: 'Breakfast',
        ingredients: '',
        steps: '',
        difficulty: 3,
        cookingTime: '',
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
            setView('form'); // Fallback to form if fetch fails
        } finally {
            setLoadingRecipes(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDifficulty = (rating) => {
        setFormData({ ...formData, difficulty: rating });
    };

    const handleEditExisting = (recipe) => {
        setFormData({
            _id: recipe._id, // Set the ID here
            title: recipe.title,
            category: recipe.category,
            ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : recipe.ingredients,
            steps: recipe.steps,
            difficulty: recipe.difficulty,
            cookingTime: recipe.cookingTime,
            isPremium: recipe.isPremium || false,
            price: recipe.price || '',
        });
        setImagePreview(recipe.image);
        setView('form');
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
            data.append('difficulty', formData.difficulty);
            data.append('steps', formData.steps);
            data.append('isPremium', formData.isPremium);
            data.append('price', formData.isPremium ? formData.price : 0);

            // Handle ingredients (array or string)
            const ingredientsArray = typeof formData.ingredients === 'string'
                ? formData.ingredients.split(/[,\n]/).map(i => i.trim()).filter(i => i)
                : formData.ingredients;

            data.append('ingredients', JSON.stringify(ingredientsArray));

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>

            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-3xl font-extrabold text-[#1a1a1a]">
                            {view === 'select' ? 'My Recipes' : (formData._id ? 'Edit Recipe' : 'New Recipe')}
                        </h2>
                        <p className="text-gray-400 text-sm font-medium mt-1">
                            {view === 'select' ? 'Manage your shared culinary creations' : 'Enter the details of your recipe below'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-white rounded-full shadow-sm">✕</button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto custom-scrollbar p-10">
                    {view === 'select' && (
                        <div className="space-y-6">
                            <button
                                onClick={() => setView('form')}
                                className="w-full p-8 rounded-[32px] border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 bg-white transition-all group flex items-center space-x-6"
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
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Edit Your Creations</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {myRecipes.slice(0, 4).map(recipe => (
                                            <button
                                                key={recipe._id}
                                                onClick={() => handleEditExisting(recipe)}
                                                className="flex items-center space-x-3 p-4 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all text-left bg-gray-50/50"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                                                    {recipe.image && <img src={recipe.image} className="w-full h-full object-cover" alt="" />}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="font-bold text-gray-800 truncate text-sm">{recipe.title}</h4>
                                                    <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase">{recipe.status}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {myRecipes.length > 4 && (
                                        <p className="text-center text-gray-400 text-xs mt-4 italic">And {myRecipes.length - 4} others...</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {error && <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-sm border border-red-100 font-medium">⚠️ {error}</div>}

                            {/* Image Upload Area */}
                            <div className="relative group">
                                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Recipe Image</label>
                                <div className="relative h-64 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                                    {imagePreview ? (
                                        <>
                                            <img src={imageFile ? imagePreview : getImageUrl(imagePreview)} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <label className="bg-white text-gray-800 px-6 py-2 rounded-xl font-bold cursor-pointer hover:scale-105 transition-transform">Replace Photo</label>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-10">
                                            <div className="mb-4 group-hover:scale-110 transition-transform flex justify-center">
                                                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-400 font-medium">Click to upload or drag & drop</p>
                                            <p className="text-[10px] text-gray-300 mt-2 uppercase font-bold">PNG, JPG or WebP up to 5MB</p>
                                        </div>
                                    )}
                                    <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Recipe Title</label>
                                    <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="The Ultimate Homemade Pizza" className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg font-semibold" />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Category</label>
                                        <select name="category" value={formData.category} onChange={handleChange} className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white font-medium">
                                            <option>Breakfast</option>
                                            <option>Lunch</option>
                                            <option>Dinner</option>
                                            <option>Dessert</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Cooking Time</label>
                                        <input type="text" name="cookingTime" required value={formData.cookingTime} onChange={handleChange} placeholder="45 Mins" className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Difficulty</label>
                                    <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button key={star} type="button" onClick={() => handleDifficulty(star)} className={`text-3xl transition-all transform hover:scale-125 ${formData.difficulty >= star ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
                                        ))}
                                        <span className="text-gray-400 font-bold ml-4">Level {formData.difficulty}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Access Type</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isPremium: false })}
                                            className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold flex items-center justify-center gap-2 ${!formData.isPremium ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                            Free Access
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isPremium: true })}
                                            className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold flex items-center justify-center gap-2 ${formData.isPremium ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            Premium
                                        </button>
                                    </div>
                                </div>

                                {formData.isPremium && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Price (NPR)</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rs.</span>
                                            <input
                                                type="number"
                                                name="price"
                                                required
                                                value={formData.price}
                                                onChange={handleChange}
                                                placeholder="199"
                                                className="w-full pl-16 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-bold text-lg"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Ingredients</label>
                                    <textarea name="ingredients" required rows="4" value={formData.ingredients} onChange={handleChange} placeholder="List items separated by commas or new lines..." className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none font-medium"></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Preparation Steps</label>
                                    <textarea name="steps" required rows="6" value={formData.steps} onChange={handleChange} placeholder="Step-by-step instructions..." className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none font-medium"></textarea>
                                </div>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                {!initialData && !formData._id && (
                                    <button type="button" onClick={() => setView('select')} className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-[24px] font-bold transition-all">Back</button>
                                )}
                                <button type="submit" disabled={loading} className="flex-[2] py-5 bg-primary hover:bg-secondary text-white rounded-[24px] font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-3 disabled:opacity-50">
                                    {loading ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Publishing...</span></>
                                    ) : (
                                        <span>{formData._id ? 'Update Recipe' : 'Publish Recipe'}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
