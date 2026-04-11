import { recipeAPI, getImageUrl } from 'lib/api';

const UNITS = ['g', 'kg', 'ml', 'L', 'tsp', 'tbsp', 'cup'];

export default function RecipeForm({ formData, setFormData, imagePreview, imageFile, setImageFile, setImagePreview, onSubmit, onBack, onDelete, loading, error, initialData }) {

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

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-5 rounded-2xl text-sm border border-red-100 dark:border-red-900/40 font-medium">⚠️ {error}</div>}

            <div className="relative group">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wider">Recipe Image</label>
                <div className="relative h-64 bg-gray-50 dark:bg-[#1a1a1a] rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                    {imagePreview ? (
                        <>
                            <img src={imageFile ? imagePreview : getImageUrl(imagePreview)} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-6 py-2 rounded-xl font-bold cursor-pointer hover:scale-105 transition-transform shadow-lg">Replace Photo</label>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-10">
                            <div className="mb-4 group-hover:scale-110 transition-transform flex justify-center">
                                <svg className="w-16 h-16 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-400 font-medium">Click to upload or drag & drop</p>
                            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-2 uppercase font-bold transition-colors">PNG, JPG or WebP up to 5MB</p>
                        </div>
                    )}
                    <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Recipe Title</label>
                    <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="The Ultimate Homemade Pizza" className="w-full px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg font-semibold placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white font-medium">
                            <option>Breakfast</option>
                            <option>Lunch</option>
                            <option>Dinner</option>
                            <option>Dessert</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Cooking Time</label>
                        <input type="text" name="cookingTime" required value={formData.cookingTime} onChange={handleChange} placeholder="45 Mins" className="w-full px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wider">Cooking Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                            'frying', 'deep_frying', 'pan_frying', 'stir_frying', 'sauteing',
                            'baking', 'roasting', 'grilling', 'pressure_cooking', 'simmering',
                            'boiling', 'steaming', 'raw', 'marinating',
                            'braising', 'stewing', 'slow_cooking'
                        ].map((method) => {
                            const isSelected = Array.isArray(formData.cookingMethod) && formData.cookingMethod.includes(method);
                            return (
                                <label key={method} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-[#1a1a1a]'}`}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                            const currentMethods = Array.isArray(formData.cookingMethod) ? formData.cookingMethod : [];
                                            const newMethods = isSelected
                                                ? currentMethods.filter(m => m !== method)
                                                : [...currentMethods, method];
                                            setFormData({ ...formData, cookingMethod: newMethods });
                                        }}
                                        className="w-5 h-5 text-primary border-gray-300 dark:border-gray-700 rounded focus:ring-primary dark:bg-gray-800"
                                    />
                                    <span className={`ml-3 text-sm font-semibold capitalize ${isSelected ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {method.replace('_', ' ')}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Difficulty</label>
                    <div className="flex items-center space-x-3 bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 transition-colors">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} type="button" onClick={() => handleDifficulty(star)} className={`text-3xl transition-all transform hover:scale-125 ${formData.difficulty >= star ? 'text-amber-400' : 'text-gray-200 dark:text-gray-800'}`}>★</button>
                        ))}
                        <span className="text-gray-400 dark:text-gray-500 font-bold ml-4">Level {formData.difficulty}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Access Type</label>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setFormData({ ...formData, isPremium: false })} className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold flex items-center justify-center gap-2 ${!formData.isPremium ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200 dark:hover:border-gray-700'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                            Free Access
                        </button>
                        <button type="button" onClick={() => setFormData({ ...formData, isPremium: true })} className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold flex items-center justify-center gap-2 ${formData.isPremium ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200 dark:hover:border-gray-700'}`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Premium
                        </button>
                    </div>
                </div>

                {formData.isPremium && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Price (NPR)</label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-gray-400 dark:text-gray-500">Rs.</span>
                            <input type="number" name="price" required value={formData.price} onChange={handleChange} placeholder="199" className="w-full pl-16 pr-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-bold text-lg placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Ingredients</label>
                    <div className="space-y-3">
                        {formData.ingredients.map((ing, index) => (
                            <div key={index} className="flex gap-3 items-center">
                                <input type="text" required value={ing.name} onChange={(e) => { const newIngs = [...formData.ingredients]; newIngs[index].name = e.target.value; setFormData({ ...formData, ingredients: newIngs }); }} placeholder="Ingredient Name" className="flex-[3] px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                                <input type="number" step="any" required value={ing.quantity} onChange={(e) => { const newIngs = [...formData.ingredients]; newIngs[index].quantity = e.target.value; setFormData({ ...formData, ingredients: newIngs }); }} placeholder="Qty" className="flex-1 px-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                                <select value={ing.unit} onChange={(e) => { const newIngs = [...formData.ingredients]; newIngs[index].unit = e.target.value; setFormData({ ...formData, ingredients: newIngs }); }} className="flex-1 px-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold appearance-none cursor-pointer">
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                                {formData.ingredients.length > 1 && (
                                    <button type="button" onClick={() => { const newIngs = formData.ingredients.filter((_, i) => i !== index); setFormData({ ...formData, ingredients: newIngs }); }} className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => setFormData({ ...formData, ingredients: [...formData.ingredients, { name: '', quantity: '', unit: 'g' }] })} className="mt-4 flex items-center gap-2 text-primary font-bold hover:text-secondary transition-colors">
                        <div className="bg-primary/10 p-2 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></div>
                        Add Another Ingredient
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">Preparation Steps</label>
                    <textarea name="steps" required rows="6" value={formData.steps} onChange={handleChange} placeholder="Step-by-step instructions..." className="w-full px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600"></textarea>
                </div>
            </div>

            <div className="flex space-x-4 pt-4">
                {onBack && (
                    <button type="button" onClick={onBack} className="flex-1 py-5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-[24px] font-bold transition-all">Back</button>
                )}
                <button type="submit" disabled={loading} className="flex-[2] py-5 bg-primary hover:bg-secondary text-white rounded-[24px] font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-3 disabled:opacity-50">
                    {loading ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Publishing...</span></>
                    ) : (
                        <span>{formData._id ? 'Update Recipe' : 'Publish Recipe'}</span>
                    )}
                </button>
                {formData._id && !formData.isPremium && (
                    <button 
                        type="button" 
                        onClick={onDelete}
                        disabled={loading}
                        className="flex-1 py-5 bg-red-500 hover:bg-red-600 text-white rounded-[24px] font-bold shadow-xl shadow-red-100 dark:shadow-none transition-all flex items-center justify-center disabled:opacity-50"
                    >
                        Delete
                    </button>
                )}
            </div>
        </form>
    );
}
