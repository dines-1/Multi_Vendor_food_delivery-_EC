import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });
      console.log('Socket connecting to:', SOCKET_URL);
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ========== ORDER TRACKING ==========
  joinOrderRoom(orderId) {
    if (this.socket) {
      this.socket.emit('join-order', orderId);
    }
  }

  leaveOrderRoom(orderId) {
    if (this.socket) {
      this.socket.emit('leave-order', orderId);
    }
  }

  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('location-updated', callback);
    }
  }

  onStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('status-updated', callback);
    }
  }

  // Helper to simulate location update (for delivery mock)
  updateLocation(orderId, location) {
    if (this.socket) {
      this.socket.emit('update-location', { orderId, location });
    }
  }

  // ========== CHAT ==========
  joinUserRoom(userId) {
    if (this.socket) {
      this.socket.emit('join-user', userId);
    }
  }

  joinConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('join-conversation', conversationId);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('leave-conversation', conversationId);
    }
  }

  sendChatMessage(conversationId, message, recipientIds) {
    if (this.socket) {
      this.socket.emit('send-message', { conversationId, message, recipientIds });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.off('new-message'); // prevent duplicates
      this.socket.on('new-message', callback);
    }
  }

  onMessageNotification(callback) {
    if (this.socket) {
      this.socket.off('message-notification');
      this.socket.on('message-notification', callback);
    }
  }

  emitTyping(conversationId, userName) {
    if (this.socket) {
      this.socket.emit('typing', { conversationId, userName });
    }
  }

  emitStopTyping(conversationId) {
    if (this.socket) {
      this.socket.emit('stop-typing', { conversationId });
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.off('user-typing');
      this.socket.on('user-typing', callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.off('user-stop-typing');
      this.socket.on('user-stop-typing', callback);
    }
  }
}

const socketService = new SocketService();
export default socketService;
