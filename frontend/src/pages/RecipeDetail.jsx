import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, recipeAPI, paymentAPI, messageAPI, getImageUrl } from 'lib/api';
import { exportRecipeToPDF } from 'lib/pdfExport';
import Navbar from '../components/Navbar';
import ChatbotPopup from '../components/ChatbotPopup';

export default function RecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [allergens, setAllergens] = useState([]);
    const [allergensLoading, setAllergensLoading] = useState(false);
    const [relatedRecipes, setRelatedRecipes] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [recipeRes, profileRes] = await Promise.allSettled([
                    recipeAPI.getById(id),
                    authAPI.getProfile()
                ]);

                const fetchedRecipe = recipeRes.status === 'fulfilled' ? recipeRes.value.data.recipe : null;
                const currentUser = profileRes.status === 'fulfilled' ? (profileRes.value.data.user || profileRes.value.data) : null;

                setRecipe(fetchedRecipe);
                setUser(currentUser);

                if (currentUser && fetchedRecipe) {
                    const liked = fetchedRecipe.likes?.some(uid => uid && (uid._id || uid).toString() === currentUser._id.toString());
                    const saved = currentUser.savedRecipes?.some(sid => sid && (sid._id || sid).toString() === id);
                    setIsLiked(liked);
                    setIsSaved(saved);
                }
                return currentUser;
            } catch (error) {
                console.error('Error fetching recipe:', error);
            } finally {
                setLoading(false);
            }
        };
        const fetchAllergens = async (currentUser) => {
            if (!id || !currentUser || !currentUser.allergies || currentUser.allergies.length === 0) {
                setAllergens([]);
                return;
            }
            setAllergensLoading(true);
            try {
                const res = await recipeAPI.getAllergens(id);
                if (res.data.success) {
                    setAllergens(res.data.allergens);
                }
            } catch (error) {
                console.error('Error fetching allergens:', error);
            } finally {
                setAllergensLoading(false);
            }
        };

        const fetchRelated = async () => {
            try {
                const res = await recipeAPI.getRelated(id);
                setRelatedRecipes(res.data.recipes || []);
            } catch (error) {
                console.error('Error fetching related recipes:', error);
            }
        };

        const init = async () => {
            const currentUser = await fetchData();
            if (currentUser) {
                fetchAllergens(currentUser);
            }
            fetchRelated();
        };

        init();
    }, [id]);

    const handleLike = async () => {
        if (!user) return navigate('/login');
        try {
            const res = await recipeAPI.like(id);
            setIsLiked(res.data.isLiked);
            setRecipe(prev => ({
                ...prev,
                likes: res.data.isLiked
                    ? [...prev.likes, user._id]
                    : prev.likes.filter(l => (l._id || l) !== user._id)
            }));
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const handleSave = async () => {
        if (!user) return navigate('/login');
        try {
            const res = await recipeAPI.save(id);
            setIsSaved(res.data.isSaved);
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!user) return navigate('/login');
        if (!commentText.trim()) return;

        try {
            const res = await recipeAPI.comment(id, commentText);
            setRecipe(prev => ({ ...prev, comments: res.data.comments }));
            setCommentText('');
        } catch (error) {
            console.error('Comment error:', error);
        }
    };

    const handlePurchase = async () => {
        if (!user) return navigate('/login');
        try {
            const res = await paymentAPI.initiate(id);
            if (res.data.success && res.data.payment_url) {
                // Save both pidx and recipeId to handle Khalti redirect flakiness
                if (res.data.pidx) localStorage.setItem('khalti_pidx', res.data.pidx);
                localStorage.setItem('khalti_recipeId', id);

                // Redirect to Khalti checkout
                window.location.href = res.data.payment_url;
            } else {
                alert('Failed to initiate payment');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            alert(error.response?.data?.message || 'Failed to initiate payment');
        }
    };

    const handleExportPDF = async () => {
        try {
            await exportRecipeToPDF(recipe, allergens);
        } catch (error) {
            alert(error.message || 'Failed to export PDF');
        }
    };

    const handleChatWithChef = async () => {
        if (!user) return navigate('/login');
        try {
            const res = await messageAPI.getRecipeOwner(id);
            if (res.data.success) {
                // Navigate to messages page and tell it to open the chat with this owner
                navigate('/messages', { state: { openChatWith: res.data.owner } });
            }
        } catch (error) {
            console.error('Chat with Chef error:', error);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff] dark:bg-[#121212] transition-colors duration-300">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (!recipe) return (
        <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#121212] flex flex-col transition-colors duration-300">
            <Navbar activePage="recipes" user={propUser} />
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">Recipe Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">This recipe might have been deleted or is currently unavailable.</p>
                <button onClick={() => navigate('/recipes')} className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition-all hover:bg-secondary">Back to Recipes</button>
            </div>
        </div>
    );

    const currentUserId = (user?._id || user?.id || '').toString().toLowerCase();
    const recipeOwnerId = (recipe.user?._id || recipe.user || '').toString().toLowerCase();
    const isOwned = currentUserId && recipeOwnerId && currentUserId === recipeOwnerId;

    const currentId = (id || '').toString().toLowerCase();
    const isPurchased = (user?.purchasedRecipes || []).some(pr => {
        const prId = (pr?._id || pr || '').toString().toLowerCase();
        return prId === currentId;
    });

    const isLocked = recipe.isPremium && !isOwned && !isPurchased;
    const isRecentlyUnlocked = recipe.isPremium && !isOwned && isPurchased;

    const showLocked = isLocked;

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-[#121212] flex flex-col animate-in fade-in duration-300 transition-colors">
            <main className="flex-grow flex flex-col bg-white dark:bg-[#121212] overflow-hidden transition-colors">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md sticky top-0 z-20 transition-colors">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-all group"
                        title="Back"
                    >
                        <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 className="ml-6 text-xl font-extrabold text-[#1a1a1a] dark:text-white truncate">{recipe.title}</h2>
                </div>

                <div className="flex-grow overflow-y-auto">
                    <div className="min-h-full flex flex-col md:flex-row">
                    {/* Left Column: Image + Ingredients */}
                    <div className="md:w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-800">
                        {/* Image Section - Compact */}
                        <div className="relative flex justify-center mb-6">
                            <div className="relative w-full max-w-[320px] aspect-[4/5] rounded-[32px] overflow-hidden shadow-lg transition-all">
                                {recipe.image ? (
                                    <img 
                                        src={getImageUrl(recipe.image)} 
                                        alt={recipe.title} 
                                        className="w-full h-full object-cover" 
                                        style={{ imageRendering: 'high-quality' }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
                                        <svg className="w-24 h-24 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                                {recipe.isPremium && (
                                    <div className={`absolute top-6 left-6 ${isRecentlyUnlocked || isOwned ? 'bg-emerald-500' : 'bg-amber-500'} text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center space-x-2 z-10`}>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            {isRecentlyUnlocked || isOwned ? (
                                                <path d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                            ) : (
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            )}
                                        </svg>
                                        <span>{isRecentlyUnlocked || isOwned ? 'Unlocked' : 'Premium Content'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ingredients Section - Below Image */}
                        {!showLocked && (
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
                                            {/* Calories */}
                                            <div>
                                                <div className="flex justify-between text-sm font-bold mb-2">
                                                    <span className="text-gray-500 dark:text-gray-400">Calories</span>
                                                    <span className="text-gray-900 dark:text-gray-100">{recipe.calories || 0} kcal</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((recipe.calories || 0) / 10, 100)}%` }}></div>
                                                </div>
                                            </div>

                                            {/* Protein */}
                                            <div>
                                                <div className="flex justify-between text-sm font-bold mb-2">
                                                    <span className="text-gray-500 dark:text-gray-400">Protein</span>
                                                    <span className="text-gray-900 dark:text-gray-100">{recipe.protein || 0}g</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((recipe.protein || 0) * 1.5, 100)}%` }}></div>
                                                </div>
                                            </div>

                                            {/* Carbs */}
                                            <div>
                                                <div className="flex justify-between text-sm font-bold mb-2">
                                                    <span className="text-gray-500 dark:text-gray-400">Carbs</span>
                                                    <span className="text-gray-900 dark:text-gray-100">{recipe.carbs || 0}g</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((recipe.carbs || 0) / 2.5, 100)}%` }}></div>
                                                </div>
                                            </div>

                                            {/* Fat */}
                                            <div>
                                                <div className="flex justify-between text-sm font-bold mb-2">
                                                    <span className="text-gray-500 dark:text-gray-400">Fat</span>
                                                    <span className="text-gray-900 dark:text-gray-100">{recipe.fat || 0}g</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((recipe.fat || 0) * 2, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Allergen Information - Only show if user has allergies set in profile */}
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

                                {/* You May Also Like Section - Now horizontal in left column */}
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
                        )}
                    </div>

                    {/* Right Column: Details + Steps */}
                    <div className="md:w-1/2 p-8 md:p-12">
                        {showLocked ? (
                            <div className="h-full flex flex-col justify-center items-center text-center">
                                <div className="mb-6 w-full max-w-md px-6">
                                    <h1 className="text-3xl font-extrabold text-[#1a1a1a] dark:text-white mb-2">{recipe.title}</h1>
                                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        <span>By Chef {recipe.user?.name || recipe.chefName}</span>
                                        <span>• {recipe.cookingTime}</span>
                                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            Premium
                                        </span>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-8 rounded-[32px] w-full mt-6 shadow-sm transition-colors">
                                        <div className="text-amber-800 dark:text-amber-200/80 font-medium mb-4">Unlock this premium recipe to see ingredients and step-by-step instructions.</div>
                                        <div className="text-3xl font-black text-amber-900 dark:text-amber-100 mb-6 flex items-baseline justify-center">
                                            <span className="text-lg mr-1">Rs.</span>
                                            {recipe.price || 0}
                                        </div>
                                        <button
                                            onClick={handlePurchase}
                                            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-lg transition shadow-lg shadow-amber-200 dark:shadow-none flex items-center justify-center space-x-3 mb-4 active:scale-95"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            <span>Pay with Khalti</span>
                                        </button>
                                        <button
                                            onClick={() => navigate(-1)}
                                            className="w-full py-2 text-gray-400 dark:text-gray-500 font-bold hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div id="recipe-content">
                                <>
                                    <div className="flex justify-between items-start mb-4">
                                        <h1 className="text-4xl font-extrabold text-[#1a1a1a] dark:text-white leading-tight">
                                            {recipe.title}
                                        </h1>
                                        <div className="flex space-x-2">
                                            <button onClick={handleLike} className={`p-3 rounded-full border transition-all flex items-center gap-2 ${isLiked ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40 text-red-500' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-red-500'}`} title="Like Recipe">
                                                <svg className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                <span className="font-bold text-sm">{recipe.likes?.length || 0}</span>
                                            </button>
                                            <button onClick={handleSave} className={`p-3 rounded-full border transition-all ${isSaved ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/40 text-amber-500' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-amber-500'}`} title="Save to Cookbook">
                                                <svg className="w-6 h-6" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                            </button>
                                            {!showLocked && (
                                                <button onClick={() => setIsChatOpen(true)} className="p-3 rounded-full border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/40 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all active:scale-95" title="Ask AI ChefBot">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                </button>
                                            )}
                                            {recipe.isPremium && !showLocked && (
                                                <button onClick={handleExportPDF} className="p-3 rounded-full border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-95" title="Export PDF">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8 space-x-6 flex-wrap gap-y-2">
                                        <span className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            {recipe.cookingTime}
                                        </span>
                                        {recipe.cookingMethod && (
                                            <span className="flex items-center gap-2">
                                                <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                                                <span className="capitalize">{recipe.cookingMethod.replace('_', ' ')}</span>
                                            </span>
                                        )}
                                        <div className="flex text-amber-400 dark:text-amber-500 gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-5 h-5 ${i < recipe.difficulty ? 'fill-current' : 'text-gray-200 dark:text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            ))}
                                        </div>
                                        <span className="flex items-center italic">
                                            By <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">Chef {recipe.user?.name || recipe.chefName}</span>
                                        </span>
                                        {recipe.calories > 0 && (
                                            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.334-.398-1.817a1 1 0 00-1.514-.857 4.028 4.028 0 00-1.888 1.867c-.372.769-.45 1.704-.45 2.721 0 1.174.335 2.261.959 3.068a3.7 3.7 0 00.458.49 5.039 5.039 0 004.3 2.25 5.039 5.039 0 004.3-2.25 3.7 3.7 0 00.458-.49c.624-.807.959-1.894.959-3.068 0-1.017-.078-1.952-.45-2.721a4.028 4.028 0 00-1.888-1.867 1 1 0 00-1.514.857c0 .483-.07 1.137-.398 1.817a2.64 2.64 0 01-.945 1.067 31.365 31.365 0 00-.613-3.58c-.226-.966-.506-1.93-.84-2.734a12.13 12.13 0 00-.57-1.116 3.66 3.66 0 00-.822-.88z" clipRule="evenodd" /></svg>
                                                {recipe.calories} kcal
                                            </span>
                                        )}
                                    </div>



                                    {/* Steps Section */}
                                    <section>
                                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 pb-2 border-b-2 border-primary/20 inline-block">Steps</h3>
                                        <div className="space-y-8 mt-6">
                                            {recipe.steps?.split('\n').filter(s => s.trim()).map((step, i) => (
                                                <div key={i} className="flex gap-6">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-gray-800 dark:bg-[#252525] text-white dark:text-gray-300 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed pt-1 font-medium">
                                                        {step}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Comments Section */}
                                    <section className="mt-16 pt-10 border-t border-gray-100 dark:border-gray-800">
                                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8">Comments ({recipe.comments?.length || 0})</h3>

                                        <form onSubmit={handleComment} className="mb-10 flex gap-4">
                                            <input
                                                type="text"
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Share your thoughts on this recipe..."
                                                className="flex-grow px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                            />
                                            <button
                                                type="submit"
                                                className="bg-primary hover:bg-secondary text-white px-8 rounded-2xl font-bold transition shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
                                            >
                                                Post
                                            </button>
                                        </form>

                                        <div className="space-y-6">
                                            {recipe.comments?.map((comment, i) => (
                                                <div key={i} className="bg-gray-50 dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 transition-colors">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">@{comment.userName}</span>
                                                        <span className="text-xs text-gray-400 dark:text-gray-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{comment.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>


                                </>
                            </div>
                        )}
                    </div>
                    </div>
                </div>
            </main>

            {/* Chatbot Popup */}
            <ChatbotPopup
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                recipeTitle={recipe?.title}
            />
        </div>
    );
}
