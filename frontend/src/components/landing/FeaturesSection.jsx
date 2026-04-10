import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Activity, ArrowRight, Flame, ShieldAlert, ChefHat } from 'lucide-react';

export default function FeaturesSection() {
    return (
        <section id="features" className="py-24 bg-white dark:bg-[#1a1a1a] border-y border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Calorie & Allergen Tracker Feature */}
                <div id="nutrition" className="flex flex-col lg:flex-row items-center gap-16 mb-32">
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 text-orange-500 mb-6 shadow-sm">
                            <Activity className="h-8 w-8" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">Smart Nutrition &<br />Allergen Tracking</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                            Get instant analysis of your meals. CookMate automatically calculates calories and flags common allergens like dairy, nuts, and gluten so you can cook with confidence.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center font-semibold text-gray-700 dark:text-gray-300">
                                <Flame className="h-6 w-6 text-orange-500 mr-3" /> Auto-calculated Calorie Counts
                            </li>
                            <li className="flex items-center font-semibold text-gray-700 dark:text-gray-300">
                                <ShieldAlert className="h-6 w-6 text-red-500 mr-3" /> Instant Allergen Warnings
                            </li>
                        </ul>
                    </div>
                    <div className="lg:w-1/2 w-full">
                        {/* Nutrition Card Mockup */}
                        <div className="saas-card p-6 bg-white dark:bg-gray-800 shadow-2xl relative rotate-2 max-w-md mx-auto">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <h4 className="font-black text-xl">Nutritional Info</h4>
                                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full font-bold">Healthy Choice</span>
                            </div>
                            <div className="flex justify-center mb-6">
                                <div className="text-center">
                                    <div className="text-5xl font-black text-orange-500">420</div>
                                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-1">Calories</div>
                                </div>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-sm font-semibold">
                                    <span className="text-gray-600 dark:text-gray-400">Protein</span>
                                    <span>24g</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                    <div className="bg-indigo-500 h-2 rounded-full w-[60%]"></div>
                                </div>
                                <div className="flex justify-between items-center text-sm font-semibold pt-2">
                                    <span className="text-gray-600 dark:text-gray-400">Carbs</span>
                                    <span>45g</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full w-[45%]"></div>
                                </div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 flex items-start border border-red-100 dark:border-red-900/50">
                                <ShieldAlert className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-sm font-bold text-red-700 dark:text-red-400">Allergen Warning</div>
                                    <div className="text-xs text-red-600 dark:text-red-300 mt-1">Contains Peanuts, Dairy</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Chatbot Feature */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-primary mb-6 shadow-sm">
                            <Bot className="h-8 w-8" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">Your Personal <br />Sous-Chef</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                            Stuck on a recipe? Missing an ingredient? Our AI-powered chatbot is available 24/7 to suggest substitutes, guide you through steps, and spark culinary inspiration.
                        </p>
                        <Link to="/signup" className="group flex items-center text-primary font-bold hover:text-secondary transition-colors">
                            Try the Chatbot <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="lg:w-1/2 w-full">
                        {/* Chatbot Interface Mockup */}
                        <div className="saas-card flex flex-col h-[400px] bg-white dark:bg-gray-800 shadow-2xl relative -rotate-2 max-w-md mx-auto overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="bg-primary p-4 flex items-center text-white">
                                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center mr-3 backdrop-blur-sm">
                                    <ChefHat className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="font-bold">ChefBot AI</div>
                                    <div className="text-xs text-indigo-100 flex items-center">
                                        <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span> Online
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 p-5 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                                <div className="flex justify-end">
                                    <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-[80%] shadow-sm">
                                        I want to make pasta, but I'm out of heavy cream. What can I use?
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[85%] shadow-sm leading-relaxed">
                                        No problem! You can substitute heavy cream with a mix of milk and butter or cream cheese. Another great dairy-free option is blended cashews or full-fat coconut milk. Which one do you have on hand?
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <div className="bg-gray-100 dark:bg-gray-900 rounded-xl px-4 py-3 flex items-center">
                                    <span className="text-gray-400 text-sm">Type a message...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
