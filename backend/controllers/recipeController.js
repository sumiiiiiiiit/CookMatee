const Recipe = require('../models/Recipe');
const User = require('../models/User');

// @desc    Get all approved recipes
// @route   GET /api/recipes
// @access  Public
exports.getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({ status: 'approved' })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: recipes.length,
            recipes,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



exports.getSavedRecipes = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Directly find the recipes that are in the user's saved array
        const recipes = await Recipe.find({ _id: { $in: user.savedRecipes } })
            .populate('user', 'name');

        res.status(200).json({
            success: true,
            savedRecipes: recipes || [],
            recipes: recipes || []
        });
    } catch (error) {
        console.error('getSavedRecipes error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.getMyRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, recipes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.getRecipeById = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id)
            .populate('user', 'name')
            .populate('comments.user', 'name');

        if (!recipe) {
            return res.status(404).json({ success: false, message: 'Recipe not found' });
        }

        res.status(200).json({ success: true, recipe });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.createRecipe = async (req, res) => {
    try {
        let { title, category, ingredients, steps, difficulty, cookingTime } = req.body;

        // Parse ingredients if sent as JSON string
        if (typeof ingredients === 'string') {
            try {
                ingredients = JSON.parse(ingredients);
            } catch (e) {
                ingredients = ingredients.split(',').map(i => i.trim());
            }
        }

        const image = req.file ? req.file.path : req.body.image; // Cloudinary URL
        const isPremium = req.body.isPremium === 'true' || req.body.isPremium === true;
        const price = Number(req.body.price) || 0;

        const recipe = await Recipe.create({
            title,
            category,
            image,
            ingredients,
            steps,
            difficulty,
            cookingTime,
            isPremium,
            price,
            user: req.user.id,
            chefName: req.user.name,
            status: 'pending',
        });

        res.status(201).json({ success: true, recipe });
    } catch (error) {
        console.error('Create recipe error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

exports.updateRecipe = async (req, res) => {
    try {
        let recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({ success: false, message: 'Recipe not found' });
        }

        // Check if owner or admin
        if (recipe.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'User not authorized' });
        }

        let { title, category, ingredients, steps, difficulty, cookingTime } = req.body;

        if (typeof ingredients === 'string') {
            try {
                ingredients = JSON.parse(ingredients);
            } catch (e) {
                ingredients = ingredients.split(',').map(i => i.trim());
            }
        }

        const updateData = {
            title: title || recipe.title,
            category: category || recipe.category,
            ingredients: ingredients || recipe.ingredients,
            steps: steps || recipe.steps,
            difficulty: difficulty || recipe.difficulty,
            cookingTime: cookingTime || recipe.cookingTime,
            isPremium: req.body.isPremium !== undefined ? (req.body.isPremium === 'true' || req.body.isPremium === true) : recipe.isPremium,
            price: req.body.price !== undefined ? Number(req.body.price) : recipe.price,
            status: 'pending', // Re-verify on edit
        };

        if (req.file) {
            updateData.image = req.file.path; // Cloudinary URL
        }

        recipe = await Recipe.findByIdAndUpdate(req.params.id, updateData, { new: true });

        res.status(200).json({ success: true, recipe });
    } catch (error) {
        console.error('Update recipe error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.likeRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

        const isLiked = recipe.likes.includes(req.user.id);

        if (isLiked) {
            recipe.likes = recipe.likes.filter(id => id.toString() !== req.user.id.toString());
        } else {
            recipe.likes.push(req.user.id);
        }

        await recipe.save();
        res.status(200).json({ success: true, likesCount: recipe.likes.length, isLiked: !isLiked });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.commentOnRecipe = async (req, res) => {
    try {
        const { text } = req.body;
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });

        recipe.comments.push({
            user: req.user.id,
            userName: req.user.name,
            text
        });

        await recipe.save();
        res.status(200).json({ success: true, comments: recipe.comments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.saveRecipe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const recipeId = req.params.id;

        const isSaved = user.savedRecipes.some(id => id.toString() === recipeId.toString());

        if (isSaved) {
            user.savedRecipes = user.savedRecipes.filter(id => id.toString() !== recipeId.toString());
        } else {
            user.savedRecipes.push(recipeId);
        }

        await user.save();
        res.status(200).json({ success: true, isSaved: !isSaved });
    } catch (error) {
        console.error('Save recipe error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Recipe.aggregate([
            { $match: { status: { $regex: /^approved$/i } } },
            { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
            { $sort: { likesCount: -1, createdAt: -1 } },
            { $limit: 10 },
            {
                $project: {
                    title: 1,
                    chefName: 1,
                    likesCount: 1,
                    category: 1,
                    _id: 1
                }
            }
        ]);

        res.status(200).json({ success: true, leaderboard });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.purchaseRecipe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const recipeId = req.params.id;

        if (user.purchasedRecipes.some(id => id.toString() === recipeId)) {
            return res.status(200).json({ success: true, message: 'Already purchased' });
        }

        user.purchasedRecipes.push(recipeId);
        await user.save();
        res.status(200).json({ success: true, message: 'Recipe unlocked successfully' });
    } catch (error) {
        console.error('Purchase error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
