const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @desc    Get all approved recipes
// @route   GET /api/recipes
// @access  Public
router.get('/', async (req, res) => {
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
});

// @desc    Get top chefs leaderboard
// @route   GET /api/recipes/leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
    try {
        // console.log('Fetching leaderboard...'); // Optional debug
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
});
// @desc    Get user's saved recipes
// @route   GET /api/recipes/saved
// @access  Private
router.get('/saved', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('savedRecipes');
        res.status(200).json({ success: true, savedRecipes: user.savedRecipes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Get current user's recipes
// @route   GET /api/recipes/my-recipes
// @access  Private
router.get('/my-recipes', protect, async (req, res) => {
    try {
        const recipes = await Recipe.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, recipes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Get single recipe
// @route   GET /api/recipes/:id
// @access  Public
router.get('/:id', async (req, res) => {
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
});

// @desc    Create new recipe with image upload
// @route   POST /api/recipes
// @access  Private
router.post('/', protect, upload.single('image'), async (req, res) => {
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

        const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
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
});

// @desc    Update recipe
// @route   PUT /api/recipes/:id
// @access  Private
router.put('/:id', protect, upload.single('image'), async (req, res) => {
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
            updateData.image = `/uploads/${req.file.filename}`;
        }

        recipe = await Recipe.findByIdAndUpdate(req.params.id, updateData, { new: true });

        res.status(200).json({ success: true, recipe });
    } catch (error) {
        console.error('Update recipe error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Like/Unlike recipe
// @route   POST /api/recipes/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
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
});

// @desc    Comment on recipe
// @route   POST /api/recipes/:id/comment
// @access  Private
router.post('/:id/comment', protect, async (req, res) => {
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
});

// @desc    Save/Unsave recipe
// @route   POST /api/recipes/:id/save
// @access  Private
router.post('/:id/save', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const recipeId = req.params.id;

        // Use some() and toString() for reliable comparison with ObjectIds
        const isSaved = user.savedRecipes.some(id => id.toString() === recipeId);

        if (isSaved) {
            user.savedRecipes = user.savedRecipes.filter(id => id.toString() !== recipeId);
        } else {
            user.savedRecipes.push(recipeId);
        }

        await user.save();
        res.status(200).json({ success: true, isSaved: !isSaved });
    } catch (error) {
        console.error('Save recipe error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



// @desc    Purchase/Unlock recipe
// @route   POST /api/recipes/:id/purchase
// @access  Private
router.post('/:id/purchase', protect, async (req, res) => {
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
});

module.exports = router;
