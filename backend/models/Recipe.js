const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert'] },
    image: { type: String, default: '' },
    ingredients: {
      type: [{ name: { type: String, required: true }, quantity: { type: String, required: true } }],
      required: true,
    },
    steps: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    chefName: { type: String, required: true },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    cookingTime: { type: String, required: true },
    cookingMethod: { type: [String], default: ['frying'] },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isPremium: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        userName: String,
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recipe', recipeSchema);
