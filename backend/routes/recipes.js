const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
    getAllRecipes,
    getLeaderboard,
    getSavedRecipes,
    getMyRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    likeRecipe,
    commentOnRecipe,
    saveRecipe,
    purchaseRecipe
} = require('../controllers/recipeController');

// Specific routes first
router.get('/leaderboard', getLeaderboard);
router.get('/saved', protect, getSavedRecipes);
router.get('/my-recipes', protect, getMyRecipes);

// Then general list route
router.get('/', getAllRecipes);

// Finally parameterized routes
router.get('/:id', getRecipeById);

// Protected action routes
router.post('/', protect, upload.single('image'), createRecipe);
router.put('/:id', protect, upload.single('image'), updateRecipe);
router.post('/:id/like', protect, likeRecipe);
router.post('/:id/comment', protect, commentOnRecipe);
router.post('/:id/save', protect, saveRecipe);
router.post('/:id/purchase', protect, purchaseRecipe);

module.exports = router;
