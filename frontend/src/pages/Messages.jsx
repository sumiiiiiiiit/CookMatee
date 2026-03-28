import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import Navbar from '../components/Navbar';
import ChatPanel from '../components/ChatPanel';
import ConversationItem from '../components/ConversationItem';
import { authAPI, messageAPI } from 'lib/api';

const SOCKET_URL = 'http://localhost:5001';


export default function Messages() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState(null);
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
            handleMessageUpdate(msg, { partner: { _id: msg.senderId }, recipe: { _id: msg.recipeId } });

            // Also append to active chat panel if we are talking to them
            const matchRecipe = (msg.recipeId || msg.recipeId?._id) === (activeChat.recipe?._id || activeChat.recipe); 
            if (activeChat && (msg.senderId === activeChat.partner._id) && matchRecipe) {
                setChatMessages(prev => {
                    // Prevent duplicates
                    if (prev.some(m => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
            }
        };

        const handleSent = (msg) => {
            // Server confirmed our sent message
            handleMessageUpdate(msg, { partner: { _id: msg.receiverId }, recipe: { _id: msg.recipeId } });

            // Replace temp message in active chat panel to prevent duplicate UI issues
            const matchRecipe = (msg.recipeId || msg.recipeId?._id) === (activeChat.recipe?._id || activeChat.recipe); 
            if (activeChat && (msg.receiverId === activeChat.partner._id) && matchRecipe) {
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
    }, [socket, activeChat]);

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
                        const targetPartner = location.state.openChatWith;
                        const targetRecipe = location.state.recipe;
                        const newActiveChat = { partner: targetPartner, recipe: targetRecipe };
                        setActiveChat(newActiveChat);

                        if (!loadedConvs.some(c => c.partner._id === targetPartner._id && c.recipe?._id === targetRecipe?._id)) {
                            loadedConvs = [{ partner: targetPartner, recipe: targetRecipe, lastMessage: null }, ...loadedConvs];
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

    const handleMessageUpdate = useCallback((newMsg, targetChat) => {
        const pid = targetChat?.partner?._id || targetChat?._id || activeChat?.partner?._id || newMsg.senderId;
        const rid = targetChat?.recipe?._id || activeChat?.recipe?._id || newMsg.recipeId || null;
        if (!pid) return;

        setConversations(prev => {
            const index = prev.findIndex(c => 
                c.partner._id.toString() === pid.toString() && 
                (c.recipe?._id?.toString() || null) === (rid?.toString() || null)
            );
            if (index > -1) {
                const updated = [...prev];
                updated[index] = { ...updated[index], lastMessage: newMsg };
                const [item] = updated.splice(index, 1);
                return [item, ...updated];
            } else {
                messageAPI.getConversations().then(res => {
                    if (res.data.success) {
                        setConversations(res.data.conversations);
                    }
                }).catch(console.error);
                return prev;
            }
        });
    }, [activeChat]);

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
                    ${activeChat ? 'hidden md:flex md:w-[340px] lg:w-[380px]' : 'w-full md:w-[380px]'}`}
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
                                {filtered.map(({ partner, recipe, lastMessage }, i) => (
                                    <ConversationItem
                                        key={`${partner._id}_${recipe?._id || "no-recipe"}`}
                                        partner={partner}
                                        recipe={recipe}
                                        lastMessage={lastMessage}
                                        user={user}
                                        activeChat={activeChat}
                                        setActiveChat={setActiveChat}
                                        formatRelTime={formatRelTime}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>

                {/* ══ RIGHT PANEL ═══════════════════════════════════════════ */}
                <main className={`flex-grow bg-[#efeae2] items-center justify-center overflow-hidden
                    ${activeChat ? 'flex' : 'hidden md:flex'}`}
                >
                    {activeChat ? (
                        /* Chat panel */
                        <div className="w-full h-full flex flex-col">
                            <ChatPanel
                                currentUser={user}
                                activeChat={activeChat}
                                onClose={() => setActiveChat(null)}
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
