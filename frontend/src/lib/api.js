import axios from 'axios';
import Cookies from 'js-cookie';

export const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5001';
const API_URL = `${BASE_URL}/api`;

export const getImageUrl = (path) => path || null;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token && token !== 'none') config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.get('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const recipeAPI = {
  getAll: () => api.get('/recipes'),
  getById: (id) => api.get(`/recipes/${id}`),
  create: (data) => api.post('/recipes', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/recipes/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/recipes/${id}`),
  getMyRecipes: () => api.get('/recipes/my-recipes'),
  getSaved: () => api.get('/recipes/saved'),
  getLeaderboard: () => api.get('/recipes/leaderboard'),
  getRelated: (id) => api.get(`/recipes/${id}/related`),
  getAllergens: (id) => api.get(`/recipes/${id}/allergens`),
  like: (id) => api.post(`/recipes/${id}/like`),
  comment: (id, text) => api.post(`/recipes/${id}/comment`, { text }),
  save: (id) => api.post(`/recipes/${id}/save`),
  purchase: (id) => api.post(`/recipes/${id}/purchase`),
  searchAI: (query) => api.get('/recipes/search', { params: { q: query } }),
  searchRecipes: (query) => api.get('/search', { params: { q: query } }),
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getRecipes: () => api.get('/admin/recipes'),
  updateRecipeStatus: (id, status) => api.put(`/admin/recipes/${id}/status`, { status }),
  notifyUser: (recipeId, message) => api.post('/admin/recipes/notify-user', { recipeId, message }),
  deleteRecipe: (id) => api.delete(`/admin/recipes/${id}`),
};

export const paymentAPI = {
  initiate: (recipeId) => api.post('/payment/initiate', { recipeId }),
  verify: (params) => api.post('/payment/verify', params),
  wallet: (recipeId) => api.post('/payment/wallet', { recipeId }),
};

export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (receiverId, recipeId) => api.get(`/messages/${receiverId}`, { params: { recipeId } }),
  getRecipeOwner: (recipeId) => api.get(`/messages/recipe-owner/${recipeId}`),
};

export const earningAPI = {
  getStats: () => api.get('/earnings/my-earnings'),
};

export default api;
