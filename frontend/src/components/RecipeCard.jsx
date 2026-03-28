import { getImageUrl } from 'lib/api';

const STAR = "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z";

export default function RecipeCard({ recipe, navigate, user }) {
    const isOwned = user && (recipe.user?._id || recipe.user) === user?._id;
    const isPurchased = user && (user.purchasedRecipes || []).some(pr => (pr?._id || pr) === recipe._id);
    const showUnlock = recipe.isPremium && !isOwned && !isPurchased;

    return (
        <div
            onClick={() => navigate(`/recipes/${recipe._id}`)}
            className="relative rounded-[2.5rem] overflow-hidden cursor-pointer group shadow-sm hover:shadow-2xl transition-all duration-500 h-80"
        >
            {recipe.image ? (
                <img src={getImageUrl(recipe.image)} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt={recipe.title} />
            ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}
            
            {/* Badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80" />
            
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-10">
                {recipe.isPremium ? (
                    <div className="bg-[#007AFF] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" /></svg>
                        PREMIUM
                    </div>
                ) : (
                    <div className="bg-white/95 text-gray-900 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border border-white/20">
                        FREE
                    </div>
                )}
                <span className="bg-black/30 backdrop-blur-md text-white/90 text-[10px] font-black px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-wider">{recipe.category}</span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-7 z-10 transition-transform duration-500 group-hover:-translate-y-2">
                <h4 className="text-xl font-black text-white leading-tight mb-2 transition-colors">{recipe.title}</h4>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60 font-bold truncate max-w-[140px]">By {recipe.chefName}</span>
                    <div className="flex text-amber-400 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-3.5 h-3.5 ${i < Math.floor(recipe.difficulty || 3) ? 'fill-current' : 'opacity-20'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d={STAR} />
                            </svg>
                        ))}
                    </div>
                </div>
            </div>

            {/* Unlock Button Overlay (on hover for premium) */}
            {showUnlock && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center p-6 z-20">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/recipes/${recipe._id}`);
                        }}
                        className="bg-white text-[#007AFF] w-full py-4 rounded-3xl font-black text-sm shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Unlock Recipe
                    </button>
                </div>
            )}
        </div>
    );
}
