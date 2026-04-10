import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import { authAPI, messageAPI, BASE_URL } from '../lib/api';

const SOCKET_URL = BASE_URL;

export default function useMessages() {
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState(null);
    const [socket, setSocket] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);

    useEffect(() => {
        const token = Cookies.get('token');
        const s = io(SOCKET_URL, { auth: { token: token || '' }, withCredentials: true, transports: ['websocket'] });
        setSocket(s);
        return () => s.disconnect();
    }, []);

    const handleMessageUpdate = useCallback((msg, target) => {
        const pid = target?.partner?._id || target?._id || activeChat?.partner?._id || msg.senderId;
        const rid = target?.recipe?._id || activeChat?.recipe?._id || msg.recipeId || null;
        if (!pid) return;
        setConversations(prev => {
            const idx = prev.findIndex(c => c.partner._id.toString() === pid.toString() && (c.recipe?._id?.toString() || null) === (rid?.toString() || null));
            if (idx > -1) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], lastMessage: msg };
                const [item] = updated.splice(idx, 1);
                return [item, ...updated];
            }
            messageAPI.getConversations().then(res => res.data.success && setConversations(res.data.conversations)).catch(console.error);
            return prev;
        });
    }, [activeChat]);

    useEffect(() => {
        if (!socket) return;
        const onRecv = (msg) => {
            handleMessageUpdate(msg, { partner: { _id: msg.senderId }, recipe: { _id: msg.recipeId } });
            const match = (msg.recipeId || msg.recipeId?._id) === (activeChat?.recipe?._id || activeChat?.recipe);
            if (activeChat && msg.senderId === activeChat.partner._id && match) {
                setChatMessages(p => p.some(m => m._id === msg._id) ? p : [...p, msg]);
            }
        };
        const onSent = (msg) => {
            handleMessageUpdate(msg, { partner: { _id: msg.receiverId }, recipe: { _id: msg.recipeId } });
            const match = (msg.recipeId || msg.recipeId?._id) === (activeChat?.recipe?._id || activeChat?.recipe);
            if (activeChat && msg.receiverId === activeChat.partner._id && match) {
                setChatMessages(p => {
                    const filtered = p.filter(m => !(m._id.toString().startsWith('temp-') && m.message === msg.message));
                    return [...filtered, msg];
                });
            }
        };
        socket.on('receive_message', onRecv);
        socket.on('message_sent', onSent);
        return () => { socket.off('receive_message', onRecv); socket.off('message_sent', onSent); };
    }, [socket, activeChat, handleMessageUpdate]);

    useEffect(() => {
        const init = async () => {
            try {
                const [prof, conv] = await Promise.all([authAPI.getProfile(), messageAPI.getConversations()]);
                const u = prof.data.user || prof.data;
                setUser(u);
                if (conv.data.success) {
                    let c = conv.data.conversations;
                    if (location.state?.openChatWith) {
                        const { openChatWith: tp, recipe: tr } = location.state;
                        setActiveChat({ partner: tp, recipe: tr });
                        if (!c.some(x => x.partner._id === tp._id && x.recipe?._id === tr?._id)) c = [{ partner: tp, recipe: tr, lastMessage: null }, ...c];
                    }
                    setConversations(c);
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        init();
        if (location.state?.openChatWith) window.history.replaceState({}, document.title);
    }, [location.state]);

    return { user, conversations, loading, activeChat, setActiveChat, socket, chatMessages, setChatMessages, handleMessageUpdate };
}
