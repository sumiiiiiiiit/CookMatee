import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, recipeAPI, getImageUrl } from '@/lib/api';
import Navbar from '../components/Navbar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function RecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

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

                if (currentUser) {
                    setIsLiked(fetchedRecipe.likes?.some(uid => uid === currentUser._id || uid._id === currentUser._id));
                    setIsSaved(currentUser.savedRecipes?.some(sid => sid === id || sid._id === id));
                }
            } catch (error) {
                console.error('Error fetching recipe:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleLike = async () => {
        if (!user) return navigate('/login');
        try {
            const res = await recipeAPI.like(id);
            setIsLiked(res.data.isLiked);
            // Locally update likes count
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
            await recipeAPI.purchase(id);
            // Re-fetch profile to update purchasedRecipes
            const profileRes = await authAPI.getProfile();
            const updatedUser = profileRes.data.user || profileRes.data;
            setUser(updatedUser);
            alert('Recipe unlocked successfully!');
        } catch (error) {
            console.error('Purchase error:', error);
            alert('Failed to unlock recipe');
        }
    };

    const handleExportPDF = async () => {
        const element = document.getElementById('recipe-content');
        if (!element) {
            alert('Recipe content not found');
            return;
        }

        try {
            // Use JPEG for smaller size, scale 2 is sufficient for print quality
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });

            // Standardize filename
            const fileName = `${recipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // Scale to fit page width
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            // Try to use File System Access API for "Save As" dialog
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'PDF Document',
                            accept: { 'application/pdf': ['.pdf'] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    const pdfBlob = pdf.output('blob');
                    await writable.write(pdfBlob);
                    await writable.close();
                    return;
                } catch (err) {
                    // User cancelled the picker
                    if (err.name === 'AbortError') return;
                    console.warn('File system access denied or failed, falling back to direct download.', err);
                }
            }

            // Fallback: browser default download
            pdf.save(fileName);
        } catch (error) {
            console.error('PDF Export error:', error);
            alert('Failed to export PDF');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (!recipe) return <div className="p-20 text-center">Recipe not found</div>;

    const isOwned = user && (user._id === recipe.user?._id || user._id === recipe.user);
    const isPurchased = user && user.purchasedRecipes?.some(sid => sid === id || sid._id === id);
    const showLocked = recipe.isPremium && !isOwned && !isPurchased;

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
            <Navbar activePage="recipes" />

            <main className="flex-grow max-w-6xl mx-auto w-full p-6 md:p-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-gray-800 transition mb-8 group"
                >
                    <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
                    Back to Recipes
                </button>

                <div className="bg-white rounded-[40px] shadow-xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                    {/* Image Section */}
                    <div className="md:w-1/2 h-[400px] md:h-auto relative bg-gray-100 flex items-center justify-center overflow-hidden">
                        {recipe.image ? (
                            <img src={getImageUrl(recipe.image)} alt={recipe.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full">
                                <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                        {recipe.isPremium && (
                            <div className="absolute top-6 left-6 bg-amber-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center space-x-2 z-10">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                <span>Premium Content</span>
                            </div>
                        )}
                    </div>

                    {/* Details/Locked Section */}
                    <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto overflow-x-hidden custom-scrollbar">
                        {showLocked ? (
                            <div className="h-full flex flex-col justify-center items-center text-center">
                                <div className="mb-6">
                                    <h1 className="text-3xl font-extrabold text-[#1a1a1a] mb-2">{recipe.title}</h1>
                                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 font-medium">
                                        <span>By Chef {recipe.user?.name || recipe.chefName}</span>
                                        <span>• {recipe.cookingTime}</span>
                                        <span className="text-amber-600 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            Premium
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div id="recipe-content">
                                <>
                                    <div className="flex justify-between items-start mb-4">
                                        <h1 className="text-4xl font-extrabold text-[#1a1a1a] leading-tight">
                                            {recipe.title}
                                        </h1>
                                        <div className="flex space-x-2">
                                            <button onClick={handleLike} className={`p-3 rounded-full border transition flex items-center gap-2 ${isLiked ? 'bg-red-50 border-red-200 text-red-500' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-red-500'}`}>
                                                <svg className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                <span className="font-bold">{recipe.likes?.length || 0}</span>
                                            </button>
                                            <button onClick={handleSave} className={`p-3 rounded-full border transition ${isSaved ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-amber-500'}`}>
                                                <svg className="w-6 h-6" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 mb-8 space-x-6">
                                        <span className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            {recipe.cookingTime}
                                        </span>
                                        <div className="flex text-amber-400 gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-5 h-5 ${i < recipe.difficulty ? 'fill-current' : 'text-gray-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                            ))}
                                        </div>
                                        <span className="flex items-center italic">
                                            By <span className="font-semibold text-gray-700 ml-1">Chef {recipe.user?.name || recipe.chefName}</span>
                                        </span>
                                    </div>

                                    <div className="mb-10">
                                        <div className="flex gap-4 mb-8">
                                            <button
                                                onClick={handleSave}
                                                className={`flex-1 ${isSaved ? 'bg-amber-600' : 'bg-amber-500'} hover:bg-amber-600 text-white py-4 rounded-xl font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-100`}
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                                <span>{isSaved ? 'Saved to Cookbook' : 'Save Recipe'}</span>
                                            </button>
                                            <button
                                                onClick={handleExportPDF}
                                                className="px-6 bg-white border-2 border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200 rounded-xl font-bold transition flex items-center justify-center space-x-2 shadow-sm"
                                                title="Export to PDF"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                <span className="hidden md:inline">Export</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-10">
                                        <section>
                                            <h3 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-primary/20 inline-block">Ingredients</h3>
                                            <ul className="space-y-3">
                                                {recipe.ingredients?.map((ing, i) => (
                                                    <li key={i} className="flex items-start text-gray-600">
                                                        <span className="mr-3 text-primary">•</span> {ing}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>

                                        <section>
                                            <h3 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-primary/20 inline-block">Steps</h3>
                                            <div className="space-y-8">
                                                {recipe.steps?.split('\n').filter(s => s.trim()).map((step, i) => (
                                                    <div key={i} className="flex gap-6">
                                                        <div className="flex-shrink-0 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                            {i + 1}
                                                        </div>
                                                        <p className="text-gray-600 leading-relaxed pt-1">
                                                            {step}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>

                                    {/* Comments Section */}
                                    <section className="mt-16 pt-10 border-t border-gray-100">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-8">Comments ({recipe.comments?.length || 0})</h3>

                                        <form onSubmit={handleComment} className="mb-10 flex gap-4">
                                            <input
                                                type="text"
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Share your thoughts on this recipe..."
                                                className="flex-grow px-6 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                            />
                                            <button
                                                type="submit"
                                                className="bg-primary hover:bg-secondary text-white px-8 rounded-2xl font-bold transition"
                                            >
                                                Post
                                            </button>
                                        </form>

                                        <div className="space-y-6">
                                            {recipe.comments?.map((comment, i) => (
                                                <div key={i} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-gray-800">@{comment.userName}</span>
                                                        <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm">{comment.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
