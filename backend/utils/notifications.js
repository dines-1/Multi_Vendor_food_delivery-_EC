import Notification from '../models/Notification.js';

export const createNotification = async ({
  recipient,
  sender = null,
  type = 'system_alert',
  title,
  message,
  relatedId = null,
}) => {
  if (!recipient || !title || !message) return null;

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    title,
    message,
    relatedId,
  });

  if (global.io) {
    global.io.to(`user_${recipient}`).emit('notification-created', notification);
  }

  return notification;
};
