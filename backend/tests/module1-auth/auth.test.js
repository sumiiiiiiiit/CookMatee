/**
 * Auth Module Tests
 * These tests cover user login, registration, and basic access control.
 * Trying to keep these robust so we don't break the onboarding flow.
 */
const request = require('supertest');
const { app } = require('../../app');
const dbHandler = require('../db-helper');
const User = require('../../models/User');

// Pulling secret from env or using fallback for local testing
const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Authentication & Access Control', () => {
    
    // UT-01: Login with valid credentials
    // Checking the happy path to make sure verified users can actually get in.
    it('UT-01: Login with valid credentials', async () => {
        await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123', isVerified: true });
        
        const res = await request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'password123'
        });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
    });

    // UT-02: Login with invalid password
    // Security check: ensure we don't accidentally let people in with the wrong password.
    it('UT-02: Login with invalid password', async () => {
        await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123', isVerified: true });
        
        const res = await request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'oops-wrong-password'
        });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.success).toBe(false);
    });

    // UT-03: Signup with missing required fields
    // Validation check: name and password are required for a new account.
    it('UT-03: Signup with missing required fields', async () => {
        const res = await request(app).post('/api/auth/register').send({
            email: 'incomplete-signup@example.com'
        });
        
        expect(res.statusCode).toEqual(400);
    });

    // UT-04: Regular member attempts to access Admin user list
    // RBAC check: normal users shouldn't be poking around admin data.
    it('UT-04: Regular member attempts to access Admin user list', async () => {
        const regularGuy = await User.create({ 
            name: 'Regular Joe', 
            email: 'joe@example.com', 
            password: 'password123', 
            role: 'user' 
        });
        
        const token = require('jsonwebtoken').sign({ id: regularGuy._id }, JWT_SECRET);
        
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toEqual(403);
    });
});


