import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, MapPin, Clock, ChevronRight } from 'lucide-react';
import './MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/orders/my-orders', {
          withCredentials: true
        });
        setOrders(data.data);
      } catch (err) {
        console.error('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="loading">Loading your orders...</div>;

  return (
    <div className="orders-page">
      <div className="container">
        <h1>My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="no-orders">
            <Package size={64} />
            <p>You haven't placed any orders yet.</p>
            <Link to="/" className="btn-primary">Browse Restaurants</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="restaurant-info">
                    <img src={order.restaurant?.logo_url || 'https://via.placeholder.com/50'} alt="logo" />
                    <div>
                      <h3>{order.restaurant?.name}</h3>
                      <p className="order-num">#{order.orderNumber}</p>
                    </div>
                  </div>
                  <div className={`order-status ${order.status}`}>
                    {order.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="order-body">
                  <div className="order-items">
                    {order.items.map((item, i) => (
                      <span key={i}>{item.quantity}x {item.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                  <div className="order-meta">
                    <span><Clock size={16} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="order-footer">
                  <div className="order-total-display">Rs. {order.total_amount}</div>
                  <Link to={`/track-order/${order._id}`} className="track-btn">
                    Track Live Order <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
