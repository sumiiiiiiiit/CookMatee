const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true, // Internal API, simple validation is fine
            trim: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert'],
        },
        image: {
            type: String, // URL to image
            default: '',
        },
        ingredients: {
            type: [{
                name: { type: String, required: true },
                quantity: { type: String, required: true }
            }],
            required: true,
        },
        steps: {
            type: String, // TODO: Consider changing to array for better formatting support
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Denormalized for easier display without population
        chefName: {
            type: String,
            required: true,
        },
        difficulty: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        cookingTime: {
            type: String, // e.g., '30 mins'
            required: true,
        },
        cookingMethod: {
            type: String,
            default: 'frying', // Defaulting so old recipes don't crash
        },
        calories: {
            type: Number,
            default: 0,
        },
        protein: {
            type: Number,
            default: 0,
        },
        carbs: {
            type: Number,
            default: 0,
        },
        fat: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        isPremium: {
            type: Boolean,
            default: false,
        },
        price: {
            type: Number,
            default: 0,
        },
       
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
        comments: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                userName: String, 
                text: {
                    type: String,
                    required: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                }
            }
        ]
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Recipe', recipeSchema);
