import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, recipeAPI, paymentAPI, messageAPI, getImageUrl } from 'lib/api';
import { exportRecipeToPDF } from 'lib/pdfExport';
import Navbar from '../components/Navbar';
import ChatbotPopup from '../components/ChatbotPopup';
import RecipeContent from '../components/RecipeContent';
import RecipeComments from '../components/RecipeComments';
import PremiumLockedState from '../components/PremiumLockedState';
import RecipeSteps from '../components/RecipeSteps';

export default function RecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
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
                navigate('/messages', { state: { openChatWith: res.data.owner, recipe: { _id: recipe._id, title: recipe.title, image: recipe.image, user: recipe.user?._id || recipe.user } } });
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
                            <RecipeContent
                                recipe={recipe}
                                allergens={allergens}
                                allergensLoading={allergensLoading}
                                relatedRecipes={relatedRecipes}
                                user={user}
                                navigate={navigate}
                                getImageUrl={getImageUrl}
                            />
                        )}
                    </div>

                    {/* Right Column: Details + Steps */}
                    <div className="md:w-1/2 p-8 md:p-12">
                        {showLocked ? (
                            <PremiumLockedState recipe={recipe} handlePurchase={handlePurchase} navigate={navigate} />
                        ) : (
                            <div id="recipe-content">
                                <>
                                    <RecipeDetailHeader
                                        recipe={recipe}
                                        isLiked={isLiked}
                                        isSaved={isSaved}
                                        handleLike={handleLike}
                                        handleSave={handleSave}
                                        setIsChatOpen={setIsChatOpen}
                                        handleChatWithChef={handleChatWithChef}
                                        handleExportPDF={handleExportPDF}
                                        showLocked={showLocked}
                                        isOwned={isOwned}
                                    />



                                    <RecipeSteps recipe={recipe} />

                                    <RecipeComments 
                                        recipe={recipe} 
                                        setRecipe={setRecipe} 
                                        user={user} 
                                        recipeId={id} 
                                    />


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
