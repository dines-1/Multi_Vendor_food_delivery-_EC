/**
 * Socket.io Event Handlers
 */
const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

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

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  // Make io instance accessible globally if needed
  global.io = io;
};

export default initSocket;
