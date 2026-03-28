import { useState, useEffect, useRef, useCallback } from 'react';
import { messageAPI } from 'lib/api';

export default function ChatPanel({ currentUser, activeChat, onClose, socket, messages, setMessages, onMessageUpdate }) {
    const partner = activeChat.partner;
    const recipe = activeChat.recipe;
    const isChef = recipe && (recipe.user === partner._id || recipe.user?._id === partner._id);
    const prefix = recipe ? (isChef ? 'Chef' : '') : '';

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimerRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

    // ── Socket typing events ──────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleTyping = ({ senderId }) => {
            if (senderId === partner._id) setIsTyping(true);
        };
        const handleStopTyping = ({ senderId }) => {
            if (senderId === partner._id) setIsTyping(false);
        };

        socket.on('user_typing', handleTyping);
        socket.on('user_stop_typing', handleStopTyping);

        return () => {
            socket.off('user_typing', handleTyping);
            socket.off('user_stop_typing', handleStopTyping);
        };
    }, [socket, partner._id]);

    // ── Load history ──────────────────────────────────────────────────────
    useEffect(() => {
        messageAPI.getMessages(partner._id, recipe?._id)
            .then(res => { if (res.data.success) setMessages(res.data.messages); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [partner._id, recipe?._id, setMessages]);

    // ── Send ──────────────────────────────────────────────────────────────
    const handleSend = useCallback((e) => {
        e.preventDefault();
        const text = input.trim();

        if (!text) return;
        
        if (!socket) {
            console.error('Socket not initialized');
            return;
        }

        if (!socket.connected) {
            socket.connect();
            return;
        }

        if (!currentUser?._id) {
            console.error('Current user not initialized');
            return;
        }

        const tempMsg = {
            _id: `temp-${Date.now()}`,
            senderId: currentUser._id,
            receiverId: partner._id,
            recipeId: recipe?._id,
            message: text,
            timestamp: new Date().toISOString(),
        };

        setInput('');
        setMessages(prev => [...prev, tempMsg]);
        if (onMessageUpdate) onMessageUpdate(tempMsg, activeChat);

        socket.emit('send_message', { receiverId: partner._id, recipeId: recipe?._id, message: text });
        socket.emit('stop_typing', { receiverId: partner._id });
    }, [input, partner, recipe, currentUser, onMessageUpdate, socket, setMessages]);

    // Handle connection status
    useEffect(() => {
        if (!socket) return;
        
        const onConnect = () => { /* Connected */ };
        const onDisconnect = (reason) => { /* Disconnected */ };
        const onConnectError = (err) => console.error('⚠️ Chat Socket Connection Error:', err.message);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
        };
    }, [socket]);

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (!socket?.connected) return;
        socket.emit('typing', { receiverId: partner._id });
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            socket.emit('stop_typing', { receiverId: partner._id });
        }, 1500);
    };

    const isMine = (msg) => {
        const sid = msg.senderId?._id || msg.senderId;
        return sid?.toString() === currentUser?._id?.toString();
    };

    const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex flex-col h-full bg-[#f0f2f5]">
            {/* ── Chat Header ────────────────────────────────────────────── */}
            <div className="bg-[#f0f2f5] border-b border-gray-200 px-5 py-3.5 flex items-center gap-4 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                    {partner.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-grow min-w-0 flex flex-col justify-center">
                    <p className="font-bold text-gray-900 text-sm leading-tight">
                        {prefix && <span className="text-violet-600 font-extrabold mr-1">{prefix}</span>}
                        {partner.name} 
                    </p>
                    {recipe && <p className="text-sm font-medium text-slate-500 mt-0.5 tracking-tight leading-none">{recipe.title}</p>}
                    {isTyping && (
                        <p className="text-xs text-emerald-500 font-medium mt-1 animate-pulse leading-none">typing…</p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    title="Close chat"
                    className="w-9 h-9 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* ── Messages Area ───────────────────────────────────────────── */}
            <div
                className="flex-grow overflow-y-auto px-6 py-4 space-y-2"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
            >
                {loading && (
                    <div className="flex justify-center pt-12">
                        <div className="w-7 h-7 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {!loading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50 pt-20">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm text-gray-500 font-medium">No messages yet — say hello!</p>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const mine = isMine(msg);
                    return (
                        <div key={msg._id || idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[65%] group`}>
                                <div
                                    className={`px-4 py-2.5 text-sm leading-relaxed break-words shadow-sm rounded-2xl
                                        ${mine
                                            ? 'bg-[#d9fdd3] text-gray-900 rounded-br-sm'
                                            : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'
                                        }`}
                                >
                                    {msg.message}
                                </div>
                                <p className={`text-[10px] mt-1 font-medium text-gray-400 ${mine ? 'text-right' : 'text-left'}`}>
                                    {formatTime(msg.timestamp)}
                                </p>
                            </div>
                        </div>
                    );
                })}

                {/* Typing bubble */}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center shadow-sm">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Input Bar ──────────────────────────────────────────────── */}
            <div className="bg-[#f0f2f5] border-t border-gray-200 px-4 py-3 flex-shrink-0">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Type a message…"
                        className="flex-grow px-5 py-3 bg-white rounded-full text-sm focus:outline-none border border-gray-200 focus:border-violet-300 transition-all font-medium placeholder-gray-400"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="w-11 h-11 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-full flex items-center justify-center hover:opacity-90 transition-all shadow-md shadow-violet-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                        <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
