import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import { authAPI, messageAPI, BASE_URL } from '../lib/api';

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
    const s = io(BASE_URL, {
      auth: { token: token || '' },
      withCredentials: true,
      transports: ['websocket'],
    });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const handleMessageUpdate = useCallback((msg, target) => {
    const partnerId = target?.partner?._id || target?._id || activeChat?.partner?._id || msg.senderId;
    const recipeId = target?.recipe?._id || activeChat?.recipe?._id || msg.recipeId || null;
    if (!partnerId) return;

    setConversations((prev) => {
      const idx = prev.findIndex(
        (c) =>
          c.partner._id.toString() === partnerId.toString() &&
          (c.recipe?._id?.toString() || null) === (recipeId?.toString() || null)
      );

      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], lastMessage: msg };
        const [item] = updated.splice(idx, 1);
        return [item, ...updated];
      }

      messageAPI.getConversations()
        .then((res) => res.data.success && setConversations(res.data.conversations))
        .catch(console.error);
      return prev;
    });
  }, [activeChat]);

  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      handleMessageUpdate(msg, { partner: { _id: msg.senderId }, recipe: { _id: msg.recipeId } });
      const recipeMatch = (msg.recipeId || msg.recipeId?._id) === (activeChat?.recipe?._id || activeChat?.recipe);
      if (activeChat && msg.senderId === activeChat.partner._id && recipeMatch) {
        setChatMessages((prev) => prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]);
      }
    };

    const onSent = (msg) => {
      handleMessageUpdate(msg, { partner: { _id: msg.receiverId }, recipe: { _id: msg.recipeId } });
      const recipeMatch = (msg.recipeId || msg.recipeId?._id) === (activeChat?.recipe?._id || activeChat?.recipe);
      if (activeChat && msg.receiverId === activeChat.partner._id && recipeMatch) {
        setChatMessages((prev) => {
          const deduped = prev.filter((m) => !(m._id.toString().startsWith('temp-') && m.message === msg.message));
          return [...deduped, msg];
        });
      }
    };

    socket.on('receive_message', onReceive);
    socket.on('message_sent', onSent);
    return () => {
      socket.off('receive_message', onReceive);
      socket.off('message_sent', onSent);
    };
  }, [socket, activeChat, handleMessageUpdate]);

  useEffect(() => {
    const init = async () => {
      try {
        const [prof, conv] = await Promise.all([authAPI.getProfile(), messageAPI.getConversations()]);
        setUser(prof.data.user || prof.data);

        if (conv.data.success) {
          let list = conv.data.conversations;
          if (location.state?.openChatWith) {
            const { openChatWith: partner, recipe } = location.state;
            setActiveChat({ partner, recipe });
            if (!list.some((c) => c.partner._id === partner._id && c.recipe?._id === recipe?._id)) {
              list = [{ partner, recipe, lastMessage: null }, ...list];
            }
          }
          setConversations(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
    if (location.state?.openChatWith) window.history.replaceState({}, document.title);
  }, [location.state]);

  return { user, conversations, loading, activeChat, setActiveChat, socket, chatMessages, setChatMessages, handleMessageUpdate };
}
