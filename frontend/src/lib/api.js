import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:5001/api';
const BASE_URL = 'http://localhost:5001';

export const getImageUrl = (path) => {
    if (!path) return null;
    // Cloudinary URLs are already complete, just return them
    return path;
};

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the token to headers
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        if (token && token !== 'none') {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.get('/auth/logout'),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
    verifyEmail: (data) => api.post('/auth/verify-email', data),
};

export const recipeAPI = {
    getAll: () => api.get('/recipes'),
    getById: (id) => api.get(`/recipes/${id}`),
    create: (data) => api.post('/recipes', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.put(`/recipes/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getMyRecipes: () => api.get('/recipes/my-recipes'),
    like: (id) => api.post(`/recipes/${id}/like`),
    comment: (id, text) => api.post(`/recipes/${id}/comment`, { text }),
    save: (id) => api.post(`/recipes/${id}/save`),
    getSaved: () => api.get('/recipes/saved'),
    purchase: (id) => api.post(`/recipes/${id}/purchase`),
    getLeaderboard: () => api.get('/recipes/leaderboard'),
};

export const adminAPI = {
    getUsers: () => api.get('/admin/users'),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getRecipes: () => api.get('/admin/recipes'),
    updateRecipeStatus: (id, status) => api.put(`/admin/recipes/${id}/status`, { status }),
    deleteRecipe: (id) => api.delete(`/admin/recipes/${id}`),
};

export default api;
