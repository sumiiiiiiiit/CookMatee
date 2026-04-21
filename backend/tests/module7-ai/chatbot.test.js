/**
 * AI Bot & Messaging Tests
 * Checking if the chatbot responds correctly and if internal messaging works.
 */
const request = require('supertest');
const { app } = require('../../app');
const dbHandler = require('../db-helper');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Constant for easy reference
const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

let user, token;

beforeAll(async () => {
    await dbHandler.connect();
    // Setting up a basic user for these interactions
    user = await User.create({ name: 'The Tester', email: 'tester@example.com', password: 'password123', isVerified: true });
    token = jwt.sign({ id: user._id }, JWT_SECRET);
});
afterAll(async () => await dbHandler.closeDatabase());

describe('AI Interaction & Direct Messaging', () => {

    // UT-19: Member submits a recipe-related prompt to the AI Bot
    // Testing the AI chatbot interface to ensure it responds to culinary queries.
    it('UT-19: Member submits a recipe-related prompt to the AI Bot', async () => {
        const res = await request(app)
            .post('/api/ai/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ prompt: 'How many calories in an apple?' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('response');
    }, 10000); // 10s timeout


    // UT-20: Send a real-time message to another user
    // Verifying that direct messaging between users is functional.
    it('UT-20: Send a real-time message to another user', async () => {
        const friend = await User.create({ name: 'Chef Friend', email: 'friend@test.com', password: 'password123' });
        
        const res = await request(app)
            .post('/api/messages/send')
            .set('Authorization', `Bearer ${token}`)
            .send({ receiverId: friend._id, message: 'Hey! Nice recipe.' });

        expect(res.statusCode).toBe(201);
    });

});


