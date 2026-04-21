/**
 * Recipe Management Tests
 * Checking if users can actually post recipes and if the admin approval flow works.
 * Standard regression tests for the core recipe engine.
 */
const request = require('supertest');
const { app } = require('../../app');
const dbHandler = require('../db-helper');
const User = require('../../models/User');
const Recipe = require('../../models/Recipe');
const jwt = require('jsonwebtoken');

// Reuse secret for consistency
const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

let token, user;

beforeAll(async () => {
    await dbHandler.connect();
    // Setting up a dummy chef for these tests
    user = await User.create({ name: 'Chef UT', email: 'chef@test.com', password: 'password123', isVerified: true });
    token = jwt.sign({ id: user._id }, JWT_SECRET);
});
afterAll(async () => await dbHandler.closeDatabase());

describe('Recipe Submission & Admin Flow', () => {

    // UT-05: Submit valid Recipe details
    // Happy path for recipe creation. Should go into 'pending' by default.
    it('UT-05: Submit valid Recipe details', async () => {
        const res = await request(app)
            .post('/api/recipes')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Homestyle Pasta',
                category: 'Lunch',
                ingredients: [{ name: 'Pasta', quantity: '200g' }],
                steps: 'Boil water, cook pasta, add sauce.',
                difficulty: 1,
                cookingTime: '15 mins'
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.recipe.status).toBe('pending');
    });

    // UT-06: Submit recipe with missing ingredients
    // Validation check: users shouldn't be able to post empty recipes.
    it('UT-06: Submit recipe with missing ingredients', async () => {
        const res = await request(app)
            .post('/api/recipes')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Ghost Meal' });
            
        expect(res.statusCode).toEqual(400);
    });

    // UT-07: Admin approves a pending recipe
    // Workflow test: verifying the admin can toggle a recipe to 'approved'.
    it('UT-07: Admin approves a pending recipe', async () => {
        const recipe = await Recipe.create({
            title: 'Under Review Recipe',
            category: 'Dinner',
            user: user._id,
            chefName: 'Chef UT',
            ingredients: [{ name: 'Water', quantity: '1L' }],
            steps: 'Just water.',
            difficulty: 1,
            cookingTime: '1 min',
            status: 'pending'
        });

        const adminUser = await User.create({ name: 'The Admin', email: 'admin-test@example.com', password: 'password123', role: 'admin' });
        const adminToken = jwt.sign({ id: adminUser._id }, JWT_SECRET);

        const res = await request(app)
            .put(`/api/admin/recipes/${recipe._id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'approved' });

        expect(res.statusCode).toEqual(200);
        
        const updated = await Recipe.findById(recipe._id);
        expect(updated.status).toBe('approved');
    });
});


