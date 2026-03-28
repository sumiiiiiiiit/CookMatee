import { useState } from 'react';
import { recipeAPI } from 'lib/api';
import { useNavigate } from 'react-router-dom';

export default function RecipeComments({ recipe, setRecipe, user, recipeId }) {
    const navigate = useNavigate();
    const [commentText, setCommentText] = useState('');

    const handleComment = async (e) => {
        e.preventDefault();
        if (!user) return navigate('/login');
        if (!commentText.trim()) return;

        try {
            const res = await recipeAPI.comment(recipeId, commentText);
            setRecipe(prev => ({ ...prev, comments: res.data.comments }));
            setCommentText('');
        } catch (error) {
            console.error('Comment error:', error);
        }
    };

    return (
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
    );
}
