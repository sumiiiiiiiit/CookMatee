import { getImageUrl } from 'lib/api';

export default function RecipeContent({ recipe, allergens, allergensLoading, relatedRecipes, user, navigate }) {
    return (
        <div className="p-8 md:p-10">
            <section className="flex flex-col xl:flex-row gap-12">
                {/* Ingredients List */}
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 pb-2 border-b-2 border-primary/20 inline-block">Ingredients</h3>
                    <ul className="space-y-4 mt-2">
                        {recipe.ingredients?.map((ing, i) => (
                            <li key={i} className="flex items-center text-gray-600 dark:text-gray-400 group border-b border-gray-50 dark:border-gray-800/20 pb-2 last:border-0">
                                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                </span>
                                <span className="font-medium text-lg capitalize flex-grow">{typeof ing === 'string' ? ing : ing.name}</span>
                                {typeof ing !== 'string' && ing.quantity && (
                                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500 italic ml-4">{ing.quantity}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Nutrition Section */}
                <div className="flex-1 max-w-sm">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 pb-2 border-b-2 border-amber-400/20 inline-block">Nutrition</h3>
                    <div className="space-y-6 bg-gray-50/50 dark:bg-gray-800/10 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800/30">
                        <NutritionBar label="Calories" value={recipe.calories || 0} unit="kcal" color="bg-amber-500" max={10} />
                        <NutritionBar label="Protein" value={recipe.protein || 0} unit="g" color="bg-emerald-500" max={1.5} />
                        <NutritionBar label="Carbs" value={recipe.carbs || 0} unit="g" color="bg-blue-500" max={2.5} />
                        <NutritionBar label="Fat" value={recipe.fat || 0} unit="g" color="bg-rose-500" max={2} />
                    </div>
                </div>
            </section>

            {/* Allergen Information */}
            {user?.allergies && user.allergies.length > 0 && (
                <section className="mt-10 pt-10 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Allergen Information</h3>
                    </div>

                    {allergensLoading ? (
                        <div className="flex items-center space-x-3 text-gray-400 text-sm animate-pulse">
                            <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                            <span>Analyzing ingredients for your allergies...</span>
                        </div>
                    ) : allergens.length > 0 ? (
                        <div className="space-y-3">
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                                <div className="flex items-start gap-4">
                                    <div className="bg-red-500 text-white p-2 rounded-xl shadow-lg shadow-red-200">
                                        <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-red-900 text-sm mb-1 uppercase tracking-tight">Warning: Allergic Ingredients Detected</h4>
                                        <p className="text-red-700 text-xs font-medium leading-relaxed mb-3">Based on your profile, we've identified ingredients you might be allergic to:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {allergens.map((item, i) => (
                                                <div key={i} className="bg-white/80 backdrop-blur border border-red-100 px-3 py-1.5 rounded-xl shadow-sm group hover:border-red-500 transition-colors">
                                                    <span className="text-red-600 font-bold capitalize text-xs mr-1.5">{item.allergen.replace('_', ' ')}</span>
                                                    {item.detected_ingredients.length > 0 && (
                                                        <span className="text-red-400 text-[10px] font-bold">(from: {item.detected_ingredients.join(', ')})</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-5 flex items-center gap-4">
                            <div className="bg-emerald-500 text-white p-2 rounded-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm mb-0.5">No Allergens Detected</h4>
                                <p className="text-emerald-700 dark:text-emerald-400 text-[10px]">None of your listed allergies were found in this recipe.</p>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Related Recipes */}
            {relatedRecipes.length > 0 && (
                <section className="mt-10 pt-10 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">You May Also Like</h3>
                    <div className="flex flex-row space-x-6 overflow-x-auto pb-6 -mx-2 px-2 scrollbar-hide">
                        {relatedRecipes.map((rel) => (
                            <div 
                                key={rel._id} 
                                className="bg-white dark:bg-[#1a1a1a] rounded-[32px] p-4 border border-gray-50 dark:border-gray-800/40 min-w-[300px] flex items-center space-x-4 shadow-sm hover:shadow-md transition-all cursor-pointer group flex-shrink-0"
                                onClick={() => {
                                    navigate(`/recipes/${rel._id}`);
                                    window.scrollTo(0, 0);
                                }}
                            >
                                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-800">
                                    {rel.image ? (
                                        <img src={getImageUrl(rel.image)} alt={rel.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-grow min-w-0">
                                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-xs truncate mb-0.5">{rel.title}</h4>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">{rel.cookingTime.split(' ')[0]}</span>
                                        <span className="text-[8px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-tighter">{rel.cookingTime.split(' ')[1] || 'MIN'}</span>
                                    </div>
                                </div>

                                <button 
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full text-[10px] font-black transition-all active:scale-95 flex-shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/recipes/${rel._id}`);
                                        window.scrollTo(0, 0);
                                    }}
                                >
                                    View
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

// Reusable mini-component for nutrition bars
function NutritionBar({ label, value, unit, color, max }) {
    const pct = unit === 'kcal' 
        ? Math.min(value / max, 100) 
        : Math.min(value * (1 / max), 100);

    return (
        <div>
            <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-gray-900 dark:text-gray-100">{value} {unit}</span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
            </div>
        </div>
    );
}
