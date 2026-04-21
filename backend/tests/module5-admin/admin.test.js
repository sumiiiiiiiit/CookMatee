/**
 * Admin Oversight & Management Tests
 * Making sure only authorized admins can mess with users and recipes.
 * Also checking for specific restrictions like not being able to delete premium recipes.
 */
const request = require('supertest');
const { app } = require('../../app');
const dbHandler = require('../db-helper');
const User = require('../../models/User');
const Recipe = require('../../models/Recipe');
const jwt = require('jsonwebtoken');

// Constant for easy reference
const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

let adminToken, adminUser, testUser, testRecipe;

beforeAll(async () => {
    await dbHandler.connect();
    
    // Setting up our main admin tester
    adminUser = await User.create({
        name: 'Super Admin',
        email: 'admin_dashboard@cookmate.com',
        password: 'admin_password',
        role: 'admin',
        isVerified: true
    });
    adminToken = jwt.sign({ id: adminUser._id }, JWT_SECRET);

    // Creating a dummy user to perform actions on
    testUser = await User.create({
        name: 'Target User',
        email: 'target@test.com',
        password: 'password123'
    });

    // Putting a pending recipe in the oven for admin tests
    testRecipe = await Recipe.create({
        title: 'Admin Test Meal',
        category: 'Lunch',
        user: testUser._id,
        chefName: testUser.name,
        ingredients: [{ name: 'Test', quantity: '1' }],
        steps: 'Test steps',
        difficulty: 1,
        cookingTime: '5 mins',
        status: 'pending'
    });
});

afterAll(async () => await dbHandler.closeDatabase());

describe('Admin Management Workflow', () => {

    // UT-14: Admin fetches all registered users successfully
    // Checking if the admin dashboard correctly lists all platform users.
    it('UT-14: Admin fetches all registered users successfully', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.users)).toBe(true);
    });

    // UT-15: Admin Rejects a pending recipe submission
    // Testing the approval/rejection workflow for community recipes.
    it('UT-15: Admin Rejects a pending recipe submission', async () => {
        const res = await request(app)
            .put(`/api/admin/recipes/${testRecipe._id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'rejected' });

        expect(res.statusCode).toEqual(200);
        const updated = await Recipe.findById(testRecipe._id);
        expect(updated.status).toBe('rejected');
    });

    // UT-16: Admin attempts to delete a Premium Recipe (Restriction)
    // Safety check: admins should not be able to delete premium content directly via this route.
    it('UT-16: Admin attempts to delete a Premium Recipe (Restriction)', async () => {
        const premium = await Recipe.create({
            title: 'Paid Masterpiece',
            category: 'Dinner',
            user: adminUser._id,
            chefName: 'Admin',
            ingredients: [{ name: 'Gold', quantity: '1g' }],
            steps: 'Private steps',
            difficulty: 5,
            cookingTime: '60',
            isPremium: true,
            status: 'approved'
        });

        const res = await request(app)
            .delete(`/api/admin/recipes/${premium._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
            
        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toMatch(/Premium recipes cannot be deleted/i);
    });

    // UT-17: Admin sends a notification email to a chef
    // Checking the feedback communication channel between admins and chefs.
    it('UT-17: Admin sends a notification email to a chef', async () => {
        const res = await request(app)
            .post('/api/admin/recipes/notify-user')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                recipeId: testRecipe._id,
                message: 'Please provide higher resolution images.'
            });
            
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Notification sent');
    });

    // UT-18: Admin deletes a user account
    // Verifying that admins can moderate the platform by removing accounts.
    // Moved to end because other tests depend on testUser.
    it('UT-18: Admin deletes a user account', async () => {
        const res = await request(app)
            .delete(`/api/admin/users/${testUser._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
            
        expect(res.statusCode).toEqual(200);
        const findUser = await User.findById(testUser._id);
        expect(findUser).toBeNull();
    });

});



