import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import socketService from '../utils/socket';
import './NotificationBell.css';

const formatTime = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const NotificationBell = ({ variant = 'light' }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    let mounted = true;

    const loadNotifications = async () => {
      setLoading(true);
      try {
        const res = await api.get('/notifications');
        if (mounted) setNotifications(res.data.data || []);
      } catch {
        if (mounted) setNotifications([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadNotifications();

    const socket = socketService.connect();
    socketService.joinUserRoom(user._id || user.id);

    const handleCreated = (notification) => {
      setNotifications((prev) => {
        if (prev.some((item) => item._id === notification._id)) return prev;
        return [notification, ...prev];
      });
    };

    socket.off('notification-created');
    socket.on('notification-created', handleCreated);

    return () => {
      mounted = false;
      socket.off('notification-created', handleCreated);
    };
  }, [user]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((item) => item._id === id ? { ...item, isRead: true } : item)
    );
    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      // Keep the optimistic UI; the next fetch will correct any mismatch.
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await api.put('/notifications/read-all');
    } catch {
      // Keep the optimistic UI; the next fetch will correct any mismatch.
    }
  };

  if (!user) return null;

  return (
    <div className={`notification-wrap ${variant}`} ref={wrapRef}>
      <button
        type="button"
        className="notification-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-head">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllAsRead}>
                <CheckCheck size={14} /> Read all
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No notifications yet</div>
            ) : (
              notifications.slice(0, 10).map((item) => (
                <button
                  type="button"
                  key={item._id}
                  className={`notification-item ${item.isRead ? '' : 'unread'}`}
                  onClick={() => markAsRead(item._id)}
                >
                  <span className="notification-dot" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.message}</small>
                  </span>
                  <em>{formatTime(item.createdAt)}</em>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
