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
}

const socketService = new SocketService();
export default socketService;
