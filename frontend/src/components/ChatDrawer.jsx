import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ArrowLeft, MessageCircle, Clock } from 'lucide-react';
import chatService from '../services/chatService';
import socketService from '../utils/socket.js';
import { useAuth } from '../context/AuthContext';
import './ChatDrawer.css';

const ChatDrawer = ({ isOpen, onClose, initialRecipient, initialOrderId }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Fetch conversations on open
  useEffect(() => {
    if (isOpen && user) {
      fetchConversations();
      const socket = socketService.connect();
      socketService.joinUserRoom(user._id || user.id);

      socketService.onNewMessage((data) => {
        if (activeConversation && data.conversationId === activeConversation._id) {
          setMessages(prev => [...prev, data.message]);
        }
        // Update conversation list
        fetchConversations();
      });

      socketService.onUserTyping((data) => {
        if (activeConversation && data.conversationId === activeConversation._id) {
          setTyping(data.userName);
        }
      });

      socketService.onUserStopTyping(() => {
        setTyping(null);
      });
    }
  }, [isOpen, user, activeConversation]);

  // If opened with a specific recipient, start/open that conversation
  useEffect(() => {
    if (isOpen && initialRecipient && user) {
      handleStartConversation(initialRecipient, initialOrderId);
    }
  }, [isOpen, initialRecipient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await chatService.getConversations();
      if (res.success) setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const handleStartConversation = async (recipient, orderId) => {
    // Check if conversation already exists
    const existing = conversations.find(c => 
      c.participants.some(p => (p._id || p) === (recipient._id || recipient.id)) &&
      (!orderId || (c.relatedOrder && (c.relatedOrder._id || c.relatedOrder) === orderId))
    );

    if (existing) {
      openConversation(existing);
    } else {
      // Send an initial message to create the conversation
      try {
        const recipientId = recipient._id || recipient.id || recipient;
        await chatService.sendMessage(recipientId, 'Hi! 👋', orderId);
        await fetchConversations();
        // Re-fetch and find the new conversation
        const res = await chatService.getConversations();
        if (res.success) {
          setConversations(res.data);
          const newConv = res.data.find(c => 
            c.participants.some(p => (p._id || p) === recipientId)
          );
          if (newConv) openConversation(newConv);
        }
      } catch (err) {
        console.error('Failed to start conversation:', err);
      }
    }
  };

  const openConversation = async (conv) => {
    setActiveConversation(conv);
    setLoading(true);
    socketService.joinConversation(conv._id);
    try {
      const res = await chatService.getMessages(conv._id);
      if (res.success) setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const otherParticipant = activeConversation.participants.find(
      p => (p._id || p) !== (user._id || user.id)
    );
    const recipientId = otherParticipant?._id || otherParticipant;

    try {
      const res = await chatService.sendMessage(
        recipientId,
        newMessage.trim(),
        activeConversation.relatedOrder?._id || activeConversation.relatedOrder
      );

      if (res.success) {
        setMessages(prev => [...prev, res.data]);
        socketService.sendChatMessage(
          activeConversation._id,
          res.data,
          [recipientId]
        );
        socketService.emitStopTyping(activeConversation._id);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (activeConversation && user) {
      socketService.emitTyping(activeConversation._id, user.name);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socketService.emitStopTyping(activeConversation._id);
      }, 2000);
    }
  };

  const getOtherParticipant = (conv) => {
    return conv.participants?.find(p => (p._id || p) !== (user?._id || user?.id));
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const goBack = () => {
    if (activeConversation) {
      socketService.leaveConversation(activeConversation._id);
    }
    setActiveConversation(null);
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="chat-overlay" onClick={onClose}></div>
      <div className="chat-drawer">
        {/* HEADER */}
        <div className="chat-drawer-header">
          {activeConversation ? (
            <>
              <button className="chat-back-btn" onClick={goBack}>
                <ArrowLeft size={18} />
              </button>
              <div className="chat-header-info">
                <div className="chat-avatar">
                  {getOtherParticipant(activeConversation)?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3>{getOtherParticipant(activeConversation)?.name || 'User'}</h3>
                  {typing && <span className="typing-text">{typing} is typing...</span>}
                </div>
              </div>
            </>
          ) : (
            <>
              <MessageCircle size={22} />
              <h3>Messages</h3>
            </>
          )}
          <button className="chat-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="chat-drawer-body">
          {!activeConversation ? (
            // Conversation List
            <div className="conversation-list">
              {conversations.length === 0 ? (
                <div className="empty-chat">
                  <MessageCircle size={48} />
                  <h4>No conversations yet</h4>
                  <p>Start a chat from your active order page.</p>
                </div>
              ) : (
                conversations.map(conv => {
                  const other = getOtherParticipant(conv);
                  return (
                    <div
                      key={conv._id}
                      className="conversation-item"
                      onClick={() => openConversation(conv)}
                    >
                      <div className="conv-avatar">
                        {other?.name?.charAt(0) || '?'}
                      </div>
                      <div className="conv-info">
                        <div className="conv-name">
                          <span>{other?.name || 'User'}</span>
                          {other?.role && <span className="conv-role">{other.role}</span>}
                        </div>
                        <p className="conv-last-msg">
                          {conv.lastMessage?.text?.substring(0, 45) || 'Start chatting...'}
                          {conv.lastMessage?.text?.length > 45 ? '...' : ''}
                        </p>
                      </div>
                      {conv.lastMessage?.createdAt && (
                        <span className="conv-time">
                          <Clock size={12} />
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            // Messages View
            <div className="messages-area">
              {loading ? (
                <div className="chat-loading">
                  <div className="chat-spinner"></div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = (msg.sender?._id || msg.sender) === (user?._id || user?.id);
                  return (
                    <div key={msg._id || idx} className={`message-bubble ${isMe ? 'sent' : 'received'}`}>
                      <p>{msg.text}</p>
                      <span className="msg-time">{formatTime(msg.createdAt)}</span>
                    </div>
                  );
                })
              )}
              {typing && (
                <div className="message-bubble received typing-bubble">
                  <div className="typing-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT (only in chat view) */}
        {activeConversation && (
          <div className="chat-input-area">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
            />
            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatDrawer;
