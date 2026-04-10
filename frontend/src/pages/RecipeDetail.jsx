import { useParams, useNavigate } from 'react-router-dom';
import useRecipeDetail from '../hooks/useRecipeDetail';
import { getImageUrl } from 'lib/api';
import Navbar from '../components/common/Navbar';
import ChatbotPopup from '../components/chat/ChatbotPopup';
import RecipeContent from '../components/recipe/RecipeContent';
import RecipeComments from '../components/recipe/RecipeComments';
import PremiumLockedState from '../components/recipe/PremiumLockedState';
import RecipeSteps from '../components/recipe/RecipeSteps';
import RecipeDetailHeader from '../components/recipe/RecipeDetailHeader';
import RecipeImage from '../components/recipe/RecipeImage';
import RecipeNotFound from '../components/recipe/RecipeNotFound';

export default function RecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { 
        recipe, user, loading, isLiked, isSaved, isChatOpen, setIsChatOpen,
        allergens, allergensLoading, relatedRecipes,
        handleLike, handleSave, handlePurchase, handleWalletPurchase, 
        handleExportPDF, handleChatWithChef, setRecipe
    } = useRecipeDetail(id, navigate);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff] dark:bg-[#121212] transition-colors duration-300">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (!recipe) return <RecipeNotFound navigate={navigate} />;

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
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-[#1a1a1a]/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md sticky top-0 z-20 transition-colors">
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
                        <RecipeImage 
                            recipe={recipe} 
                            getImageUrl={getImageUrl} 
                            isOwned={isOwned} 
                            isRecentlyUnlocked={isRecentlyUnlocked} 
                        />

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
                        <div className={`transition-all duration-1000 ${showLocked ? 'blur-2xl opacity-40 pointer-events-none select-none filter grayscale' : ''}`}>
                            <div id="recipe-content">
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
                            </div>
                        </div>
                        {showLocked && (
                            <PremiumLockedState 
                                recipe={recipe} 
                                handlePurchase={handlePurchase} 
                                onClose={() => navigate(-1)} 
                            />
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
