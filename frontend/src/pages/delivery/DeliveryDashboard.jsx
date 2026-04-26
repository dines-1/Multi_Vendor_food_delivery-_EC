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

const DeliveryDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayDeliveries: 0,
    rating: 4.9
  });
  const [requests, setRequests] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    try {
      const [statsRes, requestsRes, activeRes] = await Promise.all([
        api.get('/delivery/stats'),
        api.get('/delivery/requests'),
        api.get('/delivery/active-orders')
      ]);

      setStats(statsRes.data.data);
      setRequests(requestsRes.data.data);
      if (activeRes.data.data.length > 0) {
        setActiveDelivery(activeRes.data.data[0]);
      }
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

  if (loading) return <div className="delivery-loading">Connecting to Fleet...</div>;

  return (
    <div className="delivery-container">
      {/* Top Bar */}
      <div className="delivery-topbar">
        <div className="tb-content">
          <div className="tb-user">
            <span className="tb-greeting">Good Morning</span>
            <h2 className="tb-name">Bikash Tamang</h2>
          </div>
          <div className="tb-actions">
            <div className="tb-icon-btn"><Bell size={20} /></div>
            <div className="tb-avatar">BT</div>
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
          onClick={() => setIsOnline(!isOnline)}
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
              <span className="badge-active">Moto • Active Delivery</span>
              <span className="order-num">#{activeDelivery.orderNumber}</span>
            </div>
            
            <div className="map-mockup">
                <div className="rider-icon">🏍️</div>
                <div className="dest-icon">📍</div>
                <div className="map-timer">🟢 Live • ~12 min</div>
            </div>

            <div className="step-timeline">
              <div className={`step-item ${['preparing', 'out_for_delivery', 'delivered'].includes(activeDelivery.status) ? 'done' : 'current'}`}>
                <div className="step-point"><CheckCircle size={16} /></div>
                <div className="step-info">
                  <strong>Order Accepted</strong>
                  <span>Head to restaurant</span>
                </div>
              </div>
              <div className={`step-item ${activeDelivery.status === 'out_for_delivery' || activeDelivery.status === 'delivered' ? 'done' : activeDelivery.status === 'preparing' ? 'current' : ''}`}>
                <div className="step-point"><Package size={16} /></div>
                <div className="step-info">
                  <strong>Pick up order</strong>
                  <span>{activeDelivery.restaurant?.name}</span>
                </div>
              </div>
              <div className={`step-item ${activeDelivery.status === 'delivered' ? 'done' : activeDelivery.status === 'out_for_delivery' ? 'current' : ''}`}>
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
                    if (activeDelivery.status === 'preparing') handleUpdateStatus(activeDelivery._id, 'out_for_delivery');
                    else if (activeDelivery.status === 'out_for_delivery') handleUpdateStatus(activeDelivery._id, 'delivered');
                    else handleUpdateStatus(activeDelivery._id, 'preparing');
                }}
            >
                {activeDelivery.status === 'preparing' ? '📦 Confirm Pickup' : 
                 activeDelivery.status === 'out_for_delivery' ? '✅ Confirm Delivery' : '📍 Start Pickup'}
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
                  <span className="req-time">Just now</span>
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
            <div className="history-item">
                <div className="hist-icon">✅</div>
                <div className="hist-info">
                    <strong>Momo House Thamel</strong>
                    <span>Delivered to Lazimpat • 2.4 km</span>
                </div>
                <div className="hist-earn">+Rs 85</div>
            </div>
            <div className="history-item">
                <div className="hist-icon">✅</div>
                <div className="hist-info">
                    <strong>Pizza Palace KTM</strong>
                    <span>Delivered to Baluwatar • 3.1 km</span>
                </div>
                <div className="hist-earn">+Rs 110</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
