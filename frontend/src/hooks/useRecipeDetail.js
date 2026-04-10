import { useState, useEffect } from 'react';
import { authAPI, recipeAPI, paymentAPI, messageAPI } from '../lib/api';
import { exportRecipeToPDF } from '../lib/pdfExport';

export default function useRecipeDetail(id, navigate) {
    const [recipe, setRecipe] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [allergens, setAllergens] = useState([]);
    const [allergensLoading, setAllergensLoading] = useState(false);
    const [relatedRecipes, setRelatedRecipes] = useState([]);

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
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const fetchAllergens = async (currentUser) => {
        if (!id || !currentUser?.allergies?.length) { setAllergens([]); return; }
        setAllergensLoading(true);
        try {
            const res = await recipeAPI.getAllergens(id);
            if (res.data.success) setAllergens(res.data.allergens);
        } catch (error) { console.error(error); } 
        finally { setAllergensLoading(false); }
    };

    const fetchRelated = async () => {
        try {
            const res = await recipeAPI.getRelated(id);
            setRelatedRecipes(res.data.recipes || []);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        const init = async () => {
            const currentUser = await fetchData();
            if (currentUser) fetchAllergens(currentUser);
            fetchRelated();
        };
        init();
    }, [id]);

    const handleLike = async () => {
        if (!user) return navigate('/login');
        try {
            const res = await recipeAPI.like(id);
            setIsLiked(res.data.isLiked);
            setRecipe(p => ({
                ...p,
                likes: res.data.isLiked ? [...p.likes, user._id] : p.likes.filter(l => (l._id || l) !== user._id)
            }));
        } catch (error) { console.error(error); }
    };

    const handleSave = async () => {
        if (!user) return navigate('/login');
        try {
            const res = await recipeAPI.save(id);
            setIsSaved(res.data.isSaved);
        } catch (error) { console.error(error); }
    };

    const handlePurchase = async () => {
        if (!user) return navigate('/login');
        try {
            const res = await paymentAPI.initiate(id);
            if (res.data.success && res.data.formData) {
                const { formData, gateway_url } = res.data;
                const form = document.createElement('form');
                form.method = 'POST'; form.action = gateway_url;
                Object.entries(formData).forEach(([k, v]) => {
                    const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; form.appendChild(i);
                });
                document.body.appendChild(form); 
                form.submit(); 
            }
        } catch (error) { alert(error.response?.data?.message || 'Payment failed'); }
    };

    const handleWalletPurchase = async () => {
        if (!user) return navigate('/login');
        if (!window.confirm(`Spend Rs. ${recipe.price} from Wallet?`)) return;
        try {
            const res = await paymentAPI.wallet(id);
            if (res.data.success) { alert('Recipe unlocked!'); window.location.reload(); }
        } catch (error) { alert(error.response?.data?.message || 'Wallet payment failed'); }
    };

    const handleExportPDF = async () => {
        try { await exportRecipeToPDF(recipe, allergens); } 
        catch (error) { alert(error.message); }
    };

    const handleChatWithChef = async () => {
        if (!user) return navigate('/login');
        try {
            const res = await messageAPI.getRecipeOwner(id);
            if (res.data.success) navigate('/messages', { state: { openChatWith: res.data.owner, recipe } });
        } catch (error) { console.error(error); }
    };

    return {
        recipe, user, loading, isLiked, isSaved, isChatOpen, setIsChatOpen,
        allergens, allergensLoading, relatedRecipes,
        handleLike, handleSave, handlePurchase, handleWalletPurchase, handleExportPDF, handleChatWithChef, setRecipe
    };
}
