import { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function Chatbot() {
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hi! I\'m ChefBot AI. Ask me anything about ingredients or cooking!' }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Simulating bot response for now
        setTimeout(() => {
            const botMessage = { role: 'bot', text: 'AI not trained yet' };
            setMessages(prev => [...prev, botMessage]);
        }, 1000);
    };

    const suggestedQuestions = [
        "Vegan Substitutes?",
        "Pasta cooking time?",
        "Chicken MoMo ingredients?"
    ];

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Navbar activePage="chat" />

            <div className="flex-grow flex">
                {/* Sidebar */}
                <aside className="w-80 border-r border-gray-100 bg-[#fcfcfd] p-8 flex flex-col space-y-4">
                    <div className="mb-6">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Help</h2>
                        <div className="space-y-3">
                            {suggestedQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(q)}
                                    className="w-full text-left px-5 py-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-800 hover:shadow-sm transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Chat Area */}
                <main className="flex-grow flex flex-col bg-white">
                    {/* Header */}
                    <div className="px-10 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h1 className="saas-h1 uppercase !text-xl">ChefBot AI</h1>
                            <p className="text-xs text-gray-500 font-medium">Your personal culinary assistant</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Active</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-grow p-10 overflow-y-auto space-y-8 max-h-[calc(100vh-220px)] custom-scrollbar text-sm">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[65%] p-5 rounded-2xl leading-relaxed shadow-sm ${m.role === 'user'
                                        ? 'bg-gray-900 text-white rounded-tr-none'
                                        : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none'
                                        }`}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="px-10 py-8 border-t border-gray-100">
                        <form onSubmit={handleSend} className="flex gap-4 max-w-4xl mx-auto">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about recipes, ingredients, or techniques..."
                                className="input-field"
                            />
                            <button
                                type="submit"
                                className="btn-dark !w-auto px-10"
                                disabled={!input.trim()}
                            >
                                Send
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
