require('dotenv').config();
const mongoose = require('mongoose');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Access the collection directly to bypass Mongoose schema validation for reading/writing
        const db = mongoose.connection.db;
        const recipesCollection = db.collection('recipes');

        const recipes = await recipesCollection.find({}).toArray();
        let updatedCount = 0;

        for (const recipe of recipes) {
            let needsUpdate = false;
            let newIngredients = [];

            if (Array.isArray(recipe.ingredients)) {
                newIngredients = recipe.ingredients.map(ing => {
                    if (typeof ing === 'string') {
                        needsUpdate = true;
                        return { name: ing.trim(), quantity: '1 serving' };
                    }
                    if (typeof ing === 'object' && ing !== null && !ing.quantity) {
                        needsUpdate = true;
                        return { name: ing.name || 'Unknown', quantity: '1 serving' };
                    }
                    return ing;
                });
            } else if (typeof recipe.ingredients === 'string') {
                try {
                    const parsed = JSON.parse(recipe.ingredients);
                    if (Array.isArray(parsed)) {
                        newIngredients = parsed.map(ing => typeof ing === 'string' ? { name: ing.trim(), quantity: '1 serving' } : ing);
                    } else {
                        newIngredients = [{ name: parsed, quantity: '1 serving' }];
                    }
                } catch {
                    newIngredients = recipe.ingredients.split(',').map(i => ({ name: i.trim(), quantity: '1 serving' }));
                }
                needsUpdate = true;
            }

            // Filter out empty ones just in case
            newIngredients = newIngredients.filter(ing => ing.name && ing.name.trim() !== '');

            // Only update if there's a structure change
            // Actually, let's force check if every item is an object with a quantity
            for (const ing of newIngredients) {
                if (typeof ing === 'string' || !ing.quantity) {
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                await recipesCollection.updateOne(
                    { _id: recipe._id },
                    { $set: { ingredients: newIngredients } }
                );
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} recipes.`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrate();
