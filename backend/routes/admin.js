const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllUsers,
  deleteUser,
  getAllRecipesAdmin,
  updateRecipeStatus,
  deleteRecipeAdmin,
  notifyUser,
} = require('../controllers/adminController');

router.use(protect, admin);

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

router.get('/recipes', getAllRecipesAdmin);
router.put('/recipes/:id/status', updateRecipeStatus);
router.post('/recipes/notify-user', notifyUser);
router.delete('/recipes/:id', deleteRecipeAdmin);

module.exports = router;
