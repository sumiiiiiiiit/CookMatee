const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');
const { calculateRecipeCalories } = require('./utils/calorieCalculator');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cookmate')
    .then(async () => {
        console.log('MongoDB Connected');
        
        try {
            const recipes = await Recipe.find({});
            console.log(`Updating ${recipes.length} recipes...`);
            
            for (const recipe of recipes) {
                const nutrition = calculateRecipeCalories(recipe.ingredients, recipe.cookingMethod || 'frying');
                
                recipe.calories = nutrition.calories;
                recipe.protein = nutrition.protein;
                recipe.carbs = nutrition.carbs;
                recipe.fat = nutrition.fat;
                
                await recipe.save();
                console.log(`Updated: ${recipe.title} (C:${recipe.calories}, P:${recipe.protein}, C:${recipe.carbs}, F:${recipe.fat})`);
            }
            
            console.log('Migration completed successfully');
            process.exit(0);
        } catch (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
