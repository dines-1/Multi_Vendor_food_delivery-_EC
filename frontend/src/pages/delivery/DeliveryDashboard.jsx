import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  MapPin, 
  Navigation, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Package,
  Star
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './DeliveryDashboard.css';

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DP';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
};

const formatRelativeTime = (dateValue) => {
  if (!dateValue) return 'New';

  const diffMs = Date.now() - new Date(dateValue).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  return `${Math.floor(diffHours / 24)} day ago`;
};

const DeliveryDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayDeliveries: 0,
    rating: 4.9
  });
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetchDeliveryData();
  const interval = setInterval(() => {
    api.get('/delivery/requests')
      .then(res => setRequests(res.data.data))
      .catch(err => console.error('Failed to fetch requests', err));
  }, 30000);
  return () => clearInterval(interval);
}, []);

  const fetchDeliveryData = async () => {
    try {
      const [profileRes, statsRes, requestsRes, activeRes, historyRes] = await Promise.all([
        api.get('/delivery/profile'),
        api.get('/delivery/stats'),
        api.get('/delivery/requests'),
        api.get('/delivery/active-orders'),
        api.get('/delivery/history')
      ]);

      setProfile(profileRes.data.data);
      setIsOnline(Boolean(profileRes.data.data?.isAvailable));
      setStats(statsRes.data.data);
      setRequests(requestsRes.data.data);
      setActiveDelivery(activeRes.data.data[0] || null);
      setRecentDeliveries((historyRes.data.data || []).slice(0, 3));
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (id) => {
    try {
      await api.put(`/delivery/orders/${id}/accept`);
      toast.success('Order accepted!');
      fetchDeliveryData();
    } catch (err) {
      toast.error('Could not accept order');
    }
  };

  const handleUpdateStatus = async (id, status) => {
      try {
          await api.put(`/orders/${id}/status`, { status });
          toast.success(`Status updated to ${status}`);
          if (status === 'delivered') setActiveDelivery(null);
          fetchDeliveryData();
      } catch (err) {
          toast.error('Failed to update status');
      }
  }

  const handleAvailabilityToggle = async () => {
    const nextAvailability = !isOnline;
    setIsOnline(nextAvailability);

    try {
      const res = await api.put('/delivery/profile', { isAvailable: nextAvailability });
      setProfile(res.data.data);
      toast.success(nextAvailability ? 'You are online' : 'You are offline');
    } catch (err) {
      setIsOnline(!nextAvailability);
      toast.error('Failed to update availability');
    }
  };

  if (loading) return <div className="delivery-loading">Connecting to Fleet...</div>;

  const riderName = profile?.user?.name || 'Delivery Partner';
  const riderInitials = getInitials(riderName);
  const riderAvatar = profile?.user?.avatar;
  const vehicleLabel = profile?.vehicle_type
    ? profile.vehicle_type.charAt(0).toUpperCase() + profile.vehicle_type.slice(1)
    : 'Rider';

  return (
    <div className="delivery-container">
      {/* Top Bar */}
      <div className="delivery-topbar">
        <div className="tb-content">
          <div className="tb-user">
            <span className="tb-greeting">Good Morning</span>
            <h2 className="tb-name">{riderName}</h2>
          </div>
          <div className="tb-actions">
            <div className="tb-icon-btn"><Bell size={20} /></div>
            <div className="tb-avatar">
              {riderAvatar ? <img src={riderAvatar} alt={riderName} /> : riderInitials}
            </div>
          </div>
        </div>
      </div>

      {/* Online Toggle */}
      <div className="online-banner">
        <div className="banner-left">
          <span className="banner-label">You are currently</span>
          <div className="banner-status">
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
            {isOnline ? 'Online & Available' : 'Offline'}
          </div>
        </div>
        <div 
          className={`toggle-switch ${isOnline ? 'on' : 'off'}`}
          onClick={handleAvailabilityToggle}
        >
          <div className="switch-handle"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value primary">Rs. {stats.todayEarnings}</span>
          <span className="stat-label">Earnings</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.todayDeliveries}</span>
          <span className="stat-label">Deliveries</span>
        </div>
        <div className="stat-card">
          <div className="stat-rating">
            <Star size={14} fill="#FF5C1A" color="#FF5C1A" />
            <span className="stat-value">{stats.rating}</span>
          </div>
          <span className="stat-label">Rating</span>
        </div>
      </div>

      <div className="delivery-main-content">
        {/* Active Delivery Flow */}
        {activeDelivery ? (
          <div className="active-card fade-in">
            <div className="card-header">
              <span className="badge-active">{vehicleLabel} • Active Delivery</span>
              <span className="order-num">#{activeDelivery.orderNumber}</span>
            </div>
            
            <div className="map-mockup">
                <div className="rider-icon">🏍️</div>
                <div className="dest-icon">📍</div>
                <div className="map-timer">{activeDelivery.status?.replaceAll('_', ' ') || 'Active'}</div>
            </div>

            <div className="step-timeline">
              <div className="step-item done">
                <div className="step-point"><CheckCircle size={16} /></div>
                <div className="step-info">
                  <strong>Order Picked Up</strong>
                  <span>{activeDelivery.restaurant?.name}</span>
                </div>
              </div>
              <div className={`step-item ${activeDelivery.status === 'delivered' ? 'done' : 'current'}`}>
                <div className="step-point"><Navigation size={16} /></div>
                <div className="step-info">
                  <strong>Deliver to customer</strong>
                  <span>{activeDelivery.delivery_address?.area}</span>
                </div>
              </div>
            </div>

            <button 
                className="action-btn-primary"
                onClick={() => {
                    handleUpdateStatus(activeDelivery._id, 'delivered');
                }}
            >
                Confirm Delivery
            </button>
          </div>
        ) : (
          /* New Requests */
          <div className="requests-section fade-in">
            <div className="section-title">
              <h3>New Requests ({requests.length})</h3>
              <span className="view-all">See All</span>
            </div>
            
            {requests.map(order => (
              <div key={order._id} className="request-card">
                <div className="req-header">
                  <strong>New Order Request</strong>
                  <span className="req-time">{formatRelativeTime(order.createdAt)}</span>
                </div>
                <div className="req-body">
                  <div className="req-location">
                    <div className="loc-item">
                      <span className="dot pickup"></span>
                      <p><strong>Pickup:</strong> {order.restaurant?.name}</p>
                    </div>
                    <div className="loc-item">
                      <span className="dot drop"></span>
                      <p><strong>Drop:</strong> {order.delivery_address?.area}</p>
                    </div>
                  </div>
                  <div className="req-earning">
                    <TrendingUp size={16} />
                    <span>Estimated: <strong>Rs. {order.delivery_fee}</strong></span>
                  </div>
                </div>
                <div className="req-actions">
                  <button className="btn-accept" onClick={() => handleAcceptOrder(order._id)}>✓ Accept</button>
                  <button className="btn-decline">✗ Decline</button>
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <div className="empty-requests">
                <Clock size={32} />
                <p>Waiting for new orders nearby...</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Section */}
        <div className="recent-list-section">
          <div className="section-title">
            <h3>Recent Deliveries</h3>
            <span className="view-all">Details</span>
          </div>
          <div className="mini-history">
            {recentDeliveries.map((order) => (
              <div className="history-item" key={order._id}>
                <div className="hist-icon">✓</div>
                <div className="hist-info">
                  <strong>{order.restaurant?.name || 'Restaurant'}</strong>
                  <span>
                    Delivered to {[order.delivery_address?.area, order.delivery_address?.city].filter(Boolean).join(', ') || 'customer'}
                  </span>
                </div>
                <div className="hist-earn">+Rs {order.delivery_fee || 0}</div>
              </div>
            ))}
            {recentDeliveries.length === 0 && (
              <div className="empty-requests">
                <Clock size={28} />
                <p>No completed deliveries yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
