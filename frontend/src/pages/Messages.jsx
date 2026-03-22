import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import Navbar from '../components/Navbar';
import { authAPI, messageAPI } from 'lib/api';

const SOCKET_URL = 'http://localhost:5001';

// ─── Inline Chat Panel (right side) ──────────────────────────────────────────
function ChatPanel({ currentUser, partner, onClose, socket, messages, setMessages, onMessageUpdate }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimerRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

    // ── Socket typing events and history ──────────────────────────────────
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
        messageAPI.getMessages(partner._id)
            .then(res => { if (res.data.success) setMessages(res.data.messages); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [partner._id, setMessages]);

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
            message: text,
            timestamp: new Date().toISOString(),
        };

        // Clear input first for better UX
        setInput('');

        // Update local UI
        setMessages(prev => [...prev, tempMsg]);
        if (onMessageUpdate) onMessageUpdate(tempMsg, partner);

        // Send to server
        socket.emit('send_message', { receiverId: partner._id, message: text });
        socket.emit('stop_typing', { receiverId: partner._id });
    }, [input, partner, currentUser, onMessageUpdate, socket, setMessages]);

    // Handle connection status for better visibility
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
                <div className="flex-grow min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-none">{partner.name}</p>
                    {isTyping && (
                        <p className="text-xs text-emerald-500 font-medium mt-0.5 animate-pulse">typing…</p>
                    )}
                </div>
                {/* Close chat (back to sidebar-only) */}
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

// ─── Main Messages Page ───────────────────────────────────────────────────────
export default function Messages() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePartner, setActivePartner] = useState(null);
    const [search, setSearch] = useState('');
    const [socket, setSocket] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);

    // ── Initialize Socket Globally for the Page ──────────────────────────
    useEffect(() => {
        const token = Cookies.get('token');

        const newSocket = io(SOCKET_URL, { 
            auth: { token: token || '' },
            withCredentials: true,
            transports: ['websocket'] 
        });
        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, []);

    // ── Handle Global Socket Events ──────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleReceive = (msg) => {
            // Update conversation list globally (finding by senderId)
            handleMessageUpdate(msg, msg.senderId);

            // Also append to active chat panel if we are talking to them
            if (activePartner && (msg.senderId === activePartner._id)) {
                setChatMessages(prev => {
                    // Prevent duplicates
                    if (prev.some(m => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
            }
        };

        const handleSent = (msg) => {
            // Server confirmed our sent message
            handleMessageUpdate(msg, msg.receiverId);

            // Replace temp message in active chat panel to prevent duplicate UI issues
            if (activePartner && (msg.receiverId === activePartner._id)) {
                setChatMessages(prev => {
                    // Remove optimistic temp message with exact same text, append verified one
                    const filtered = prev.filter(m => !(m._id.toString().startsWith('temp-') && m.message === msg.message));
                    return [...filtered, msg];
                });
            }
        };

        socket.on('receive_message', handleReceive);
        socket.on('message_sent', handleSent);

        return () => {
            socket.off('receive_message', handleReceive);
            socket.off('message_sent', handleSent);
        };
    }, [socket, activePartner]);

    // ── Load Initial Data ────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const profileRes = await authAPI.getProfile();
                const u = profileRes.data.user || profileRes.data;
                setUser(u);

                const convRes = await messageAPI.getConversations();
                if (convRes.data.success) {
                    let loadedConvs = convRes.data.conversations;

                    // If we were forwarded here from a recipe with someone to chat with
                    if (location.state?.openChatWith) {
                        const target = location.state.openChatWith;
                        setActivePartner(target);

                        // If they aren't in the list yet, insert them at the top so the UI looks continuous
                        if (!loadedConvs.some(c => c.partner._id === target._id)) {
                            loadedConvs = [{ partner: target, lastMessage: null }, ...loadedConvs];
                        }
                    }

                    setConversations(loadedConvs);
                }
            } catch (err) {
                console.error('Messages init error:', err);
            } finally {
                setLoading(false);
            }
        };
        init();

        // Clear state so a refresh doesn't automatically re-open it if they closed it
        if (location.state?.openChatWith) {
            window.history.replaceState({}, document.title)
        }
    }, [location.state]);

    const handleMessageUpdate = useCallback((newMsg, targetPartner) => {
        // targetPartner could be an ID string or a full partner object
        const pid = (targetPartner?._id || targetPartner) || activePartner?._id;
        if (!pid) return;

        setConversations(prev => {
            const index = prev.findIndex(c => c.partner._id.toString() === pid.toString());
            if (index > -1) {
                const updated = [...prev];
                updated[index] = { ...updated[index], lastMessage: newMsg };
                // Move updated conversation to the top
                const [item] = updated.splice(index, 1);
                return [item, ...updated];
            } else {
                // Not found in current list, refetch conversations to dynamically pick up the new partner
                messageAPI.getConversations().then(res => {
                    if (res.data.success) {
                        setConversations(res.data.conversations);
                    }
                }).catch(console.error);
                return prev;
            }
        });
    }, [activePartner]);

    const formatRelTime = (ts) => {
        if (!ts) return '';
        const diff = Date.now() - new Date(ts).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const d = Math.floor(h / 24);
        if (d === 1) return 'Yesterday';
        return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const filtered = conversations.filter(({ partner }) =>
        partner.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-violet-500 border-t-transparent" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
            <Navbar activePage="messages" user={user} />

            {/* ── WhatsApp-style two-panel layout ────────────────────────── */}
            <div className="flex-grow flex overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>

                {/* ══ LEFT SIDEBAR ══════════════════════════════════════════ */}
                <aside className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-200 flex-shrink-0
                    ${activePartner ? 'hidden md:flex md:w-[340px] lg:w-[380px]' : 'w-full md:w-[380px]'}`}
                >
                    {/* Sidebar header */}
                    <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
                        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Chats</h1>
                        <button
                            onClick={() => navigate(-1)}
                            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                            title="Go back"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Search bar */}
                    <div className="px-4 pb-3 flex-shrink-0">
                        <div className="flex items-center bg-[#f0f2f5] rounded-full px-4 py-2.5 gap-2">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search conversations…"
                                className="flex-grow bg-transparent text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Conversation list */}
                    <div className="flex-grow overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                                <div className="w-20 h-20 rounded-full bg-[#f0f2f5] border-2 border-dashed border-gray-200 flex items-center justify-center">
                                    <svg className="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-600 text-sm">No messages yet</p>
                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                        Purchase a premium recipe and<br />tap <span className="text-violet-500 font-semibold">Chat with Chef</span> to start.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <ul>
                                {filtered.map(({ partner, lastMessage }, i) => {
                                    const isMe = lastMessage?.senderId?.toString() === user?._id?.toString();
                                    const isActive = activePartner?._id === partner._id;
                                    return (
                                        <li key={partner._id}>
                                            <button
                                                onClick={() => setActivePartner(partner)}
                                                className={`w-full text-left px-4 py-3.5 flex items-center gap-3.5 transition-colors border-b border-gray-50
                                                    ${isActive ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f8]'}`}
                                            >
                                                {/* Avatar */}
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-sm">
                                                        {partner.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    {/* Online indicator placeholder */}
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-grow min-w-0">
                                                    <div className="flex justify-between items-baseline gap-2">
                                                        <span className="font-bold text-gray-900 text-sm truncate">{partner.name}</span>
                                                        <span className="text-[10px] text-gray-400 flex-shrink-0 font-medium">
                                                            {formatRelTime(lastMessage?.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                                                        {lastMessage
                                                            ? (isMe
                                                                ? <span><span className="text-gray-400">You: </span>{lastMessage.message}</span>
                                                                : lastMessage.message)
                                                            : <span className="italic text-gray-400">No messages yet</span>
                                                        }
                                                    </p>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </aside>

                {/* ══ RIGHT PANEL ═══════════════════════════════════════════ */}
                <main className={`flex-grow bg-[#efeae2] items-center justify-center overflow-hidden
                    ${activePartner ? 'flex' : 'hidden md:flex'}`}
                >
                    {activePartner ? (
                        /* Chat panel */
                        <div className="w-full h-full flex flex-col">
                            <ChatPanel
                                currentUser={user}
                                partner={activePartner}
                                onClose={() => setActivePartner(null)}
                                socket={socket}
                                messages={chatMessages}
                                setMessages={setChatMessages}
                                onMessageUpdate={(msg, p) => handleMessageUpdate(msg, p)}
                            />
                        </div>
                    ) : (
                        /* WhatsApp-style empty right panel */
                        <div className="flex flex-col items-center justify-center gap-5 text-center select-none">
                            <div className="w-32 h-32 rounded-full bg-white/40 backdrop-blur flex items-center justify-center shadow-inner">
                                <svg className="w-16 h-16 text-gray-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8"
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-gray-500/70 tracking-tight">CookMate Chat</p>
                                <p className="text-sm text-gray-400/70 mt-2 font-medium">
                                    Select a conversation to start messaging
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400/60 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                End-to-end encrypted · Premium chefs only
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
