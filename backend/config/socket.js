/**
 * Socket.io Event Handlers
 */
const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ========== USER ROOM (for chat) ==========
    socket.on('join-user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${socket.id} joined personal room: user_${userId}`);
    });

    // ========== ORDER TRACKING ==========
    // Join a specific order room
    socket.on('join-order', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`User ${socket.id} joined room: order_${orderId}`);
    });

    // Leave a specific order room
    socket.on('leave-order', (orderId) => {
      socket.leave(`order_${orderId}`);
      console.log(`User ${socket.id} left room: order_${orderId}`);
    });

    /**
     * Location Update Event
     * Expected data: { orderId, location: { lat, lng } }
     */
    socket.on('update-location', (data) => {
      const { orderId, location } = data;
      
      // Broadcast location to everyone in the order room except sender
      socket.to(`order_${orderId}`).emit('location-updated', {
        orderId,
        location,
        timestamp: new Date()
      });

      console.log(`Location updated for order ${orderId}:`, location);
    });

    // ========== CHAT MESSAGING ==========
    /**
     * Join a conversation room
     * Expected data: conversationId
     */
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
      console.log(`User ${socket.id} joined conversation: conv_${conversationId}`);
    });

    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    /**
     * Send a chat message
     * Expected data: { conversationId, message, recipientIds }
     * message: the full message object from the API response
     * recipientIds: array of user IDs to notify
     */
    socket.on('send-message', (data) => {
      const { conversationId, message, recipientIds } = data;

      // Broadcast to the conversation room (everyone except sender)
      socket.to(`conv_${conversationId}`).emit('new-message', {
        conversationId,
        message
      });

      // Also notify recipients via their personal rooms (for badge updates)
      if (recipientIds && recipientIds.length > 0) {
        recipientIds.forEach(userId => {
          socket.to(`user_${userId}`).emit('message-notification', {
            conversationId,
            message
          });
        });
      }

      console.log(`Message sent in conversation ${conversationId}`);
    });

    /**
     * Typing indicator
     * Expected data: { conversationId, userName }
     */
    socket.on('typing', (data) => {
      socket.to(`conv_${data.conversationId}`).emit('user-typing', {
        conversationId: data.conversationId,
        userName: data.userName
      });
    });

    socket.on('stop-typing', (data) => {
      socket.to(`conv_${data.conversationId}`).emit('user-stop-typing', {
        conversationId: data.conversationId
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  // Make io instance accessible globally if needed
  global.io = io;
};

export default initSocket;
