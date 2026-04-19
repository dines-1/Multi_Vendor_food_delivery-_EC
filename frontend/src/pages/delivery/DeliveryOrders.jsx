import React, { useState, useEffect, useRef } from 'react';
import { Package, MapPin, Navigation, CheckCircle, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import deliveryService from '../../services/deliveryService';
import socketService from '../../utils/socket.js';
import { toast } from 'react-hot-toast';
import './Delivery.css';

const DeliveryOrders = () => {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'active'
  const [requests, setRequests] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const locationInterval = useRef(null);

  useEffect(() => {
    fetchData();
    // Connect socket for real-time updates
    socketService.connect();

    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'requests') {
        const data = await deliveryService.getOrderRequests();
        setRequests(data.data);
      } else {
        const data = await deliveryService.getActiveOrders();
        setActiveOrders(data.data);
        
        // Start location pings if there are active orders
        if (data.data.length > 0) {
          startLocationPings(data.data[0]._id); // Ping for the first active order
        }
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const startLocationPings = (orderId) => {
    if (locationInterval.current) clearInterval(locationInterval.current);
    
    // Initial ping
    sendLocationPing(orderId);

    // 20-second interval
    locationInterval.current = setInterval(() => {
      sendLocationPing(orderId);
    }, 20000);
  };

  const sendLocationPing = (orderId) => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Update DB
        await deliveryService.updateLocation(location);
        
        // Emit via socket
        socketService.updateLocation(orderId, location);
        console.log('Location ping sent for order:', orderId);
      },
      (error) => console.error('Error getting location:', error),
      { enableHighAccuracy: true }
    );
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const data = await deliveryService.acceptOrder(orderId);
      if (data.success) {
        toast.success('Order accepted! Head to the restaurant.');
        setActiveTab('active');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      // We can reuse the order update logic or add a delivery specific one
      const { data } = await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status }, { withCredentials: true });
      if (data.success) {
        toast.success(`Order status: ${status}`);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="delivery-orders-page fade-in">
      <div className="orders-header">
        <h1>Orders Management</h1>
        <div className="tab-switcher">
          <button 
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            New Requests ({requests.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Deliveries ({activeOrders.length})
          </button>
        </div>
      </div>

      <div className="orders-content">
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : activeTab === 'requests' ? (
          <div className="requests-list">
            {requests.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} />
                <p>No new delivery requests at the moment.</p>
              </div>
            ) : (
              requests.map(order => (
                <div key={order._id} className="order-request-card card">
                  <div className="restaurant-preview">
                    <div className="res-icon">
                      <Package size={20} />
                    </div>
                    <div>
                      <h4>{order.restaurant?.name}</h4>
                      <p>{order.restaurant?.address}</p>
                    </div>
                  </div>
                  <div className="order-brief">
                    <div className="brief-item">
                      <span>Total</span>
                      <strong>Rs. {order.total_amount}</strong>
                    </div>
                    <div className="brief-item">
                      <span>Distance</span>
                      <strong>~2.4 km</strong>
                    </div>
                  </div>
                  <button className="accept-btn" onClick={() => handleAcceptOrder(order._id)}>
                    Accept Delivery Request
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="active-deliveries">
            {activeOrders.length === 0 ? (
              <div className="empty-state">
                <Navigation size={48} />
                <p>You have no active deliveries.</p>
                <button onClick={() => setActiveTab('requests')}>Find Requests</button>
              </div>
            ) : (
              activeOrders.map(order => (
                <div key={order._id} className="active-order-card card">
                    <div className="active-header">
                        <span className="order-id">#{order.orderNumber}</span>
                        <span className={`status-tag ${order.status}`}>{order.status}</span>
                    </div>
                    
                    <div className="delivery-steps">
                        <div className="step">
                            <div className="step-dot active"></div>
                            <div className="step-info">
                                <label>Pickup from</label>
                                <strong>{order.restaurant?.name}</strong>
                                <p>{order.restaurant?.address}</p>
                            </div>
                        </div>
                        <div className="step">
                            <div className={`step-dot ${order.status === 'out_for_delivery' ? 'active' : ''}`}></div>
                            <div className="step-info">
                                <label>Deliver to</label>
                                <strong>{order.delivery_address.street}</strong>
                                <p>{order.delivery_address.area}, {order.delivery_address.city}</p>
                            </div>
                        </div>
                    </div>

                    <div className="active-actions">
                        {order.status === 'preparing' && (
                            <button className="status-btn yellow" onClick={() => handleUpdateStatus(order._id, 'out_for_delivery')}>
                                Mark as Picked Up
                            </button>
                        )}
                        {order.status === 'out_for_delivery' && (
                            <button className="status-btn green" onClick={() => handleUpdateStatus(order._id, 'delivered')}>
                                <CheckCircle size={18} /> Mark as Delivered
                            </button>
                        )}
                    </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryOrders;
