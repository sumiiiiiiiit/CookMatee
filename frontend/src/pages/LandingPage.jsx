import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChefHat, Search, Bot, Activity, ArrowRight, Star, Heart, Flame, ShieldAlert, Utensils, Crown, Clock } from 'lucide-react';
import logo from '../assets/logo.png';
import { recipeAPI } from '../lib/api';
import TrendingRecipes from '../components/landing/TrendingRecipes';
import FeaturesSection from '../components/landing/FeaturesSection';

export default function LandingPage() {
    const navigate = useNavigate();

    // Check if user is already logged in, redirect to home
    useEffect(() => {
        const token = localStorage.getItem('token') || document.cookie.includes('token');
        if (token) {
            navigate('/home');
        }
    }, [navigate]);

    const [allRecipes, setAllRecipes] = useState([]);
    const [displayRecipes, setDisplayRecipes] = useState([]);

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const response = await recipeAPI.getAll();
                if (response.data && response.data.success) {
                    setAllRecipes(response.data.recipes);
                }
            } catch (error) {
                console.error("Failed to fetch recipes:", error);
            }
        };
        fetchRecipes();
    }, []);

    useEffect(() => {
        if (allRecipes.length === 0) return;

        const getRandom = () => [...allRecipes].sort(() => 0.5 - Math.random()).slice(0, 4);
        setDisplayRecipes(getRandom());

        const interval = setInterval(() => {
            setDisplayRecipes(getRandom());
        }, 10000);

        return () => clearInterval(interval);
    }, [allRecipes]);

    return (
        <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans font-medium selection:bg-primary/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#f8f9ff]/80 dark:bg-[#121212]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex flex-shrink-0 items-center cursor-pointer" onClick={() => navigate('/')}>
                            <img src={logo} alt="CookMate Logo" className="h-10 w-auto mr-3 hover:rotate-[10deg] transition-transform duration-300" onError={(e) => e.target.style.display='none'} />
                            <span className="font-extrabold text-2xl tracking-tight text-primary">CookMate</span>
                        </div>
                        <div className="hidden md:flex space-x-8 items-center">
                            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-bold uppercase tracking-wider">Features</a>
                            <a href="#recipes" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-bold uppercase tracking-wider">Recipes</a>
                            <a href="#nutrition" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-bold uppercase tracking-wider">Nutrition</a>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors font-bold px-4 py-2">Log in</Link>
                            <Link to="/signup" className="btn-primary flex items-center shadow-lg shadow-indigo-500/30">
                                Get Started <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200 dark:bg-indigo-900/30 rounded-full blur-[100px] opacity-70 transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-200 dark:bg-indigo-900/20 rounded-full blur-[100px] opacity-60 transform -translate-x-1/2 translate-y-1/2"></div>
                </div>
                
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-slideUp">
                    <div className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700 mb-8 shadow-sm">
                        <Bot className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Meet your AI Cooking Assistant</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                        Cook Smarter, Not <br className="hidden md:block"/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Harder</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                        Discover new recipes, track calories, identify allergens, and get step-by-step cooking guidance from our intelligent AI chatbot.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <Link to="/signup" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto shadow-xl shadow-indigo-500/20 transition-transform transform hover:-translate-y-1">
                            Start Cooking for Free
                        </Link>
                        <Link to="/login" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold px-8 py-4 rounded-xl transition-all duration-200 w-full sm:w-auto shadow-sm transition-transform transform hover:-translate-y-1">
                            Explore Recipes
                        </Link>
                    </div>
                </div>
            </section>

            {/* Recipes Grid Section */}
            <TrendingRecipes displayRecipes={displayRecipes} />

            {/* Categories Section */}
            <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black mb-3">Browse by Category</h2>
                        <p className="text-gray-600 dark:text-gray-400">Find exactly what you're craving for.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
                    {['Breakfast', 'Healthy', 'Dessert', 'Vegan', 'Dinner', 'Drinks'].map((category, i) => (
                        <div key={category} className="group cursor-pointer flex flex-col items-center">
                            <div className={`w-32 h-32 rounded-full mb-4 flex items-center justify-center p-1 shadow-lg group-hover:scale-105 transition-transform duration-300
                                ${i === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 
                                  i === 1 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                                  i === 2 ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600' :
                                  i === 3 ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                                  i === 4 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' :
                                  'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                                <Search className="h-10 w-10 opacity-70 group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="font-bold text-lg group-hover:text-primary transition-colors">{category}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Feature Cards / Showcase */}
            <FeaturesSection />

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-br from-primary to-indigo-700 text-white text-center rounded-t-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0zIDJoMTh2MThIM3oiLz48cGF0aCBkPSJNMyA5aDE4Ii8+PHBhdGggZD0iTTkgMjFWMzkiLz48L3N2Zz4=')] bg-repeat"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Cook a Masterpiece?</h2>
                    <p className="text-xl text-indigo-100 mb-10 text-center mx-auto max-w-2xl">
                        Join CookMate today and get access to thousands of recipes, AI assistance, and a community of food lovers.
                    </p>
                    <Link to="/signup" className="bg-white text-primary hover:bg-gray-50 text-xl font-bold py-4 px-10 rounded-xl transition-all duration-200 shadow-xl inline-block transform hover:scale-105">
                        Create Your Free Account
                    </Link>
                </div>
            </section>
        </div>
    );
}
