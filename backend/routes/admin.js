const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
    getAllUsers,
    deleteUser,
    getAllRecipesAdmin,
    updateRecipeStatus,
    deleteRecipeAdmin
} = require('../controllers/adminController');

// Apply protection to all admin routes
router.use(protect);
router.use(admin);

// User management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Recipe management
router.get('/recipes', getAllRecipesAdmin);
router.put('/recipes/:id/status', updateRecipeStatus);
router.delete('/recipes/:id', deleteRecipeAdmin);

module.exports = router;
