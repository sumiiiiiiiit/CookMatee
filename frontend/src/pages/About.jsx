import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function About() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
            <Navbar activePage="about" />

            {/* About Content (Image 3 style) */}
            <main className="flex-grow flex items-center justify-center p-6 bg-[#f0f2f9]">
                <div className="bg-white rounded-[40px] shadow-xl p-12 max-w-5xl w-full border border-gray-100">
                    <h1 className="text-[42px] font-extrabold text-[#1a1a1a] text-center mb-6">About CookMate</h1>

                    <p className="text-gray-500 text-lg leading-relaxed text-center max-w-3xl mx-auto mb-16">
                        CookMate is a modern recipe-sharing platform designed to connect passionate cooks, professional
                        chefs and food lovers. Our mission is to preserve authentic recipes, empower chefs to monetize
                        their skills and help users cook confidently at home.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Community Card */}
                        <div className="bg-[#fff9f4] p-8 rounded-[32px] border border-orange-50 flex flex-col items-center text-center">
                            <div className="w-12 h-12 flex items-center justify-center mb-4 text-orange-500">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Community</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Share, like and save recipes from cooks around the world.
                            </p>
                        </div>

                        {/* Quality Card */}
                        <div className="bg-[#fff9f4] p-8 rounded-[32px] border border-orange-50 flex flex-col items-center text-center">
                            <div className="w-12 h-12 flex items-center justify-center mb-4 text-amber-500">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Quality</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Verified chefs and premium recipes with step-by-step guidance.
                            </p>
                        </div>

                        {/* Smart Assistance Card */}
                        <div className="bg-[#fff9f4] p-8 rounded-[32px] border border-orange-50 flex flex-col items-center text-center">
                            <div className="w-12 h-12 flex items-center justify-center mb-4 text-blue-500">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Smart Help</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Get instant help with ingredients, substitutions and cooking tips.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
