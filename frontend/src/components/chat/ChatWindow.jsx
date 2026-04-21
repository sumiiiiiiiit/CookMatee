import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import { messageAPI, BASE_URL } from '../../lib/api';

const SOCKET_URL = BASE_URL;

export default function ChatWindow({ isOpen, onClose, currentUser, recipientId, recipientName }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (!isOpen || !currentUser?._id) return;

        const token = Cookies.get('token');
        const socket = io(SOCKET_URL, {
            auth: { token: token || '' },
            withCredentials: true,
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('receive_message', (msg) => {
            if (
                msg.senderId === recipientId ||
                msg.receiverId === recipientId
            ) {
                setMessages((prev) => {
                    // Prevent duplicates
                    if (prev.some((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        socket.on('message_sent', (msg) => {
            // Only update if this message was sent to the current recipient
            if (msg.receiverId === recipientId) {
                setMessages((prev) => {
                    // Remove the optimistic temp message with exact same text, then append verified one
                    const filtered = prev.filter(m => !(m._id.toString().startsWith('temp-') && m.message === msg.message));
                    
                    // Also ensure we don't duplicate verified ones
                    if (filtered.some((m) => m._id === msg._id)) return filtered;
                    
                    return [...filtered, msg];
                });
            }
        });

        socket.on('user_typing', ({ senderId }) => {
            if (senderId === recipientId) setIsTyping(true);
        });

        socket.on('user_stop_typing', ({ senderId }) => {
            if (senderId === recipientId) setIsTyping(false);
        });

        socket.on('message_error', ({ error }) => {
            console.error('Message error:', error);
        });

        return () => {
            socket.disconnect();
        };
    }, [isOpen, currentUser, recipientId]);

    useEffect(() => {
        if (!isOpen || !recipientId) return;
        setMessages([]);
        setLoading(true);
        messageAPI
            .getMessages(recipientId)
            .then((res) => {
                if (res.data.success) setMessages(res.data.messages);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isOpen, recipientId]);

    const handleSend = useCallback(
        (e) => {
            e.preventDefault();
            const text = input.trim();
            if (!text || !socketRef.current) return;

            if (!socketRef.current.connected) {
                socketRef.current.connect();
                return;
            }

            // Optimistic UI: add immediately
            const optimistic = {
                _id: `temp-${Date.now()}`,
                senderId: currentUser._id,
                receiverId: recipientId,
                message: text,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, optimistic]);
            setInput('');

            socketRef.current.emit('send_message', {
                receiverId: recipientId,
                message: text,
            });

            // Stop typing indicator
            socketRef.current.emit('stop_typing', { receiverId: recipientId });
        },
        [input, recipientId, currentUser]
    );

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (!socketRef.current?.connected) return;
        socketRef.current.emit('typing', { receiverId: recipientId });
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            socketRef.current?.emit('stop_typing', { receiverId: recipientId });
        }, 1500);
    };

    const formatTime = (ts) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isMine = (msg) => {
        const sid = msg.senderId?._id || msg.senderId;
        return sid?.toString() === currentUser?._id?.toString();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 w-[380px] h-[600px] bg-white rounded-[32px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col z-[1001] border border-gray-100/60 backdrop-blur-sm transition-all duration-300 animate-slideUp">

            <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-extrabold text-base">
                        {recipientName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-none">{recipientName || 'Chat'}</p>
                        <p className="text-[10px] text-white/60 font-semibold uppercase tracking-widest mt-1">
                            {isTyping ? (
                                <span className="text-emerald-300 animate-pulse">Typing…</span>
                            ) : (
                                'Chef · Direct Message'
                            )}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    aria-label="Close chat"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div
                className="flex-grow overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-slate-50 to-white"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
            >
                {loading && (
                    <div className="flex justify-center py-10">
                        <div className="w-7 h-7 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {!loading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
                        <div className="w-14 h-14 rounded-3xl bg-violet-50 flex items-center justify-center">
                            <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                            Start a conversation with<br />
                            <span className="text-violet-500 font-bold">Chef {recipientName}</span>
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const mine = isMine(msg);
                    return (
                        <div key={msg._id || idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            {!mine && (
                                <div className="w-7 h-7 rounded-xl bg-violet-100 text-violet-600 font-extrabold text-xs flex items-center justify-center mr-2 flex-shrink-0 self-end mb-1">
                                    {recipientName?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className={`max-w-[75%] group`}>
                                <div
                                    className={`px-4 py-3 text-sm leading-relaxed break-words shadow-sm ${mine
                                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-md'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-md'
                                        }`}
                                >
                                    {msg.message}
                                </div>
                                <p className={`text-[10px] mt-1 font-medium ${mine ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                                    {formatTime(msg.timestamp)}
                                </p>
                            </div>
                        </div>
                    );
                })}

                {/* Typing bubble */}
                {isTyping && (
                    <div className="flex justify-start items-end gap-2">
                        <div className="w-7 h-7 rounded-xl bg-violet-100 text-violet-600 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                            {recipientName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1 items-center shadow-sm">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Type a message…"
                        className="flex-grow px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:bg-white transition-all font-medium placeholder-gray-300"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-3 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-violet-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex-shrink-0"
                        aria-label="Send message"
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
