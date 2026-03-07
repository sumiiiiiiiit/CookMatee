import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function ChatbotPopup({ isOpen, onClose, recipeTitle }) {
    const [messages, setMessages] = useState([
        { role: 'bot', text: `Hi! I'm ChefBot AI. Currently helping you with "${recipeTitle || 'this recipe'}". Ask me anything!` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        const messageToSend = input.trim();
        if (!messageToSend) return;

        const userMessage = { role: 'user', text: messageToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const context = recipeTitle ? `I am looking at the recipe for ${recipeTitle}. ` : '';
            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/ai/chat`, {
                message: context + messageToSend
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                setMessages(prev => [...prev, { role: 'bot', text: response.data.message }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: response.data.message || 'Something went wrong.' }]);
            }
        } catch (error) {
            console.error('Chatbot Error:', error);
            let displayMsg = 'Error connecting to the AI service.';
            setMessages(prev => [...prev, { role: 'bot', text: displayMsg }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`fixed bottom-6 right-6 w-[380px] h-[580px] bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col z-[1000] border border-gray-100/50 backdrop-blur-sm transition-all duration-300 transform ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold tracking-tight leading-none mb-1">ChefBot AI</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Active Assistant</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-grow p-5 overflow-y-auto space-y-5 bg-slate-50/50 custom-scrollbar">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] p-4 rounded-2xl leading-relaxed text-sm shadow-sm ${m.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                }`}
                        >
                            {m.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] p-4 rounded-2xl bg-white border border-gray-100 text-gray-500 rounded-tl-none italic text-sm flex items-center gap-3">
                            <div className="flex gap-1 py-1">
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about ingredients..."
                        className="flex-grow px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all font-medium"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 active:scale-95"
                        disabled={!input.trim() || isLoading}
                    >
                        <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
