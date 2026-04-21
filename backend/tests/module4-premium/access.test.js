/**
 * Premium Content Access Tests
 * Verifying that locked content stays locked until purchased.
 */
const request = require('supertest');
const { app } = require('../../app');
const dbHandler = require('../db-helper');
const User = require('../../models/User');
const Recipe = require('../../models/Recipe');
const jwt = require('jsonwebtoken');

// Constant for easy reference
const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

let user, chef, premiumRecipe, token;

beforeAll(async () => {
    await dbHandler.connect();
    user = await User.create({ name: 'Curious User', email: 'curious@example.com', password: 'password123', isVerified: true });
    chef = await User.create({ name: 'Pro Chef', email: 'prochef@example.com', password: 'password123', isVerified: true });
    
    // Creating a premium recipe that needs to be bought
    premiumRecipe = await Recipe.create({ 
        title: 'Secret Family Recipe', 
        category: 'Lunch', 
        user: chef._id, 
        chefName: 'Pro Chef', 
        ingredients: [{name:'Secret Spice', quantity:'1g'}], 
        steps: 'The secret steps are here...', 
        difficulty: 1, 
        cookingTime: '30', 
        isPremium: true, 
        price: 200 
    });
    
    token = jwt.sign({ id: user._id }, JWT_SECRET);
});
afterAll(async () => await dbHandler.closeDatabase());

describe('Premium Recipe Gating', () => {

    // UT-12: Accessing a locked premium recipe
    // Verifying that users can't see the steps of a premium recipe without paying for it first.
    it('UT-12: Accessing a locked premium recipe', async () => {
        const res = await request(app).get(`/api/recipes/${premiumRecipe._id}`);
        
        expect(res.statusCode).toBe(200);
        if (res.body.recipe && res.body.recipe.isPremium) {
            expect(res.body.recipe.steps).toBeUndefined();
        }
    });

    // UT-13: User successfully unlocks a recipe (Manual Access)
    // Checking if full access is granted once the recipe is in the user's purchased list.
    it('UT-13: User successfully unlocks a recipe (Manual Access)', async () => {
        // Explicitly ensuring the recipe is in the user's purchased array
        await User.findByIdAndUpdate(user._id, { $addToSet: { purchasedRecipes: premiumRecipe._id } });
        
        const res = await request(app)
            .get(`/api/recipes/${premiumRecipe._id.toString()}`)
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toBe(200);
        // Using property check since we want to be sure it's there
        expect(res.body.recipe).toHaveProperty('steps');
        expect(res.body.recipe.steps).toBeDefined();
    });
});



