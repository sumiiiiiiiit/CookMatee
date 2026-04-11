const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { calculateRecipeCalories } = require('../utils/calorieCalculator');

// @desc    Get all approved recipes
// @route   GET /api/recipes
// @access  Public
exports.getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({ status: 'approved' })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: recipes.length, recipes });
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
        let { title, category, ingredients, steps, difficulty, cookingTime, cookingMethod } = req.body;

        if (typeof ingredients === 'string') {
            try {
                ingredients = JSON.parse(ingredients);
            } catch (e) {
                ingredients = ingredients.split(',').map(i => i.trim());
            }
        }

        if (Array.isArray(ingredients)) {
            ingredients = ingredients.map(i => {
                if (typeof i === 'string') return { name: i, quantity: `${Math.floor(Math.random() * 50 + 1) * 10}g` };
                return i;
            }).filter(i => i && i.name);
        }

        if (typeof cookingMethod === 'string') {
            try {
                cookingMethod = JSON.parse(cookingMethod);
            } catch (e) {
                cookingMethod = [cookingMethod];
            }
        }

        const nutrition = calculateRecipeCalories(ingredients, cookingMethod || 'frying');
        const calories = nutrition.calories;
        const protein = nutrition.protein;
        const carbs = nutrition.carbs;
        const fat = nutrition.fat;

        const image = req.file ? req.file.path : req.body.image;
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
            cookingMethod: cookingMethod || 'frying',
            calories,
            protein,
            carbs,
            fat,
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

        if (recipe.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'User not authorized' });
        }

        let { title, category, ingredients, steps, difficulty, cookingTime, cookingMethod } = req.body;

        if (typeof ingredients === 'string') {
            try {
                ingredients = JSON.parse(ingredients);
            } catch (e) {
                ingredients = ingredients.split(',').map(i => i.trim());
            }
        }

        if (Array.isArray(ingredients)) {
            ingredients = ingredients.map(i => {
                if (typeof i === 'string') return { name: i, quantity: `${Math.floor(Math.random() * 50 + 1) * 10}g` };
                return i;
            }).filter(i => i && i.name);
        }

        if (typeof cookingMethod === 'string') {
            try {
                cookingMethod = JSON.parse(cookingMethod);
            } catch (e) {
                cookingMethod = cookingMethod ? [cookingMethod] : undefined;
            }
        }

        const nutrition = calculateRecipeCalories(ingredients || recipe.ingredients, cookingMethod || recipe.cookingMethod || 'frying');
        const calories = nutrition.calories;
        const protein = nutrition.protein;
        const carbs = nutrition.carbs;
        const fat = nutrition.fat;

        const updateData = {
            title: title || recipe.title,
            category: category || recipe.category,
            ingredients: ingredients || recipe.ingredients,
            steps: steps || recipe.steps,
            difficulty: difficulty || recipe.difficulty,
            cookingTime: cookingTime || recipe.cookingTime,
            cookingMethod: cookingMethod || recipe.cookingMethod || 'frying',
            calories,
            protein,
            carbs,
            fat,
            isPremium: req.body.isPremium !== undefined ? (req.body.isPremium === 'true' || req.body.isPremium === true) : recipe.isPremium,
            price: req.body.price !== undefined ? Number(req.body.price) : recipe.price,
            status: 'pending',
        };

        if (req.file) {
            updateData.image = req.file.path;
        }

        recipe = await Recipe.findByIdAndUpdate(req.params.id, updateData, { new: true });

        res.status(200).json({ success: true, recipe });
    } catch (error) {
        console.error('Update recipe error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({ success: false, message: 'Recipe not found' });
        }

        if (recipe.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'User not authorized' });
        }

        if (recipe.isPremium) {
            return res.status(403).json({ success: false, message: 'Premium recipes cannot be deleted' });
        }

        await Recipe.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Recipe deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


