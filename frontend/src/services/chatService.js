import api from './api';

const chatService = {
  getConversations: async () => {
    const res = await api.get('/chat/conversations');
    return res.data;
  },

  sendMessage: async (recipientId, text, orderId = null) => {
    const res = await api.post('/chat/messages', { recipientId, text, orderId });
    return res.data;
  },

  getMessages: async (conversationId) => {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  },
};

export default chatService;
