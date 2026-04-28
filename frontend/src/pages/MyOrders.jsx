import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, Clock, ChevronRight, Star, MessageCircle, RotateCcw } from 'lucide-react';
import ReviewModal from '../components/ReviewModal';
import ChatDrawer from '../components/ChatDrawer';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [chatOrderId, setChatOrderId] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState(new Set());
  const { addToCart } = useCart();

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

  const handleRateOrder = (order) => {
    setReviewOrder(order);
    setShowReview(true);
  };

  const handleReviewClose = (submitted) => {
    setShowReview(false);
    if (submitted && reviewOrder) {
      setReviewedOrders(prev => new Set([...prev, reviewOrder._id]));
      toast.success('Review submitted!');
    }
    setReviewOrder(null);
  };

  const handleMessageRestaurant = (order) => {
    setChatRecipient({
      _id: order.restaurant?.owner || order.restaurant?._id,
      name: order.restaurant?.name
    });
    setChatOrderId(order._id);
    setShowChat(true);
  };

  const handleReorder = async (order) => {
    try {
      for (const item of order.items) {
        if (item.menuItem) {
          await addToCart(item.menuItem._id || item.menuItem, item.quantity);
        }
      }
      toast.success('Items added to cart!');
    } catch (err) {
      toast.error('Failed to reorder');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      case 'out_for_delivery': return 'status-otw';
      case 'preparing': return 'status-preparing';
      default: return 'status-pending';
    }
  };

  if (loading) return <div className="loading">Loading your orders...</div>;

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p className="orders-subtitle">{orders.length} total orders</p>
        </div>
        
        {orders.length === 0 ? (
          <div className="no-orders">
            <Package size={64} />
            <p>You haven't placed any orders yet.</p>
            <Link to="/" className="btn-primary">Browse Restaurants</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const isDelivered = order.status === 'delivered';
              const isReviewed = reviewedOrders.has(order._id);
              const isActive = ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status);

              return (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div className="restaurant-info">
                      <img src={order.restaurant?.logo_url || 'https://via.placeholder.com/50'} alt="logo" />
                      <div>
                        <h3>{order.restaurant?.name}</h3>
                        <p className="order-num">#{order.orderNumber}</p>
                      </div>
                    </div>
                    <div className={`order-status ${getStatusColor(order.status)}`}>
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
                    <div className="order-actions">
                      {/* Active orders → Track */}
                      {isActive && (
                        <Link to={`/track-order/${order._id}`} className="track-btn">
                          Track Live <ChevronRight size={16} />
                        </Link>
                      )}

                      {/* Delivered orders → Rate / Message / Reorder */}
                      {isDelivered && !isReviewed && (
                        <button className="rate-btn" onClick={() => handleRateOrder(order)}>
                          <Star size={16} /> Rate
                        </button>
                      )}
                      {isDelivered && isReviewed && (
                        <span className="reviewed-badge">
                          <Star size={14} fill="currentColor" /> Reviewed
                        </span>
                      )}
                      {isDelivered && (
                        <>
                          <button className="msg-btn" onClick={() => handleMessageRestaurant(order)}>
                            <MessageCircle size={16} />
                          </button>
                          <button className="reorder-btn" onClick={() => handleReorder(order)}>
                            <RotateCcw size={16} /> Reorder
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReview}
        onClose={handleReviewClose}
        orderId={reviewOrder?._id}
        restaurantName={reviewOrder?.restaurant?.name}
      />

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={showChat}
        onClose={() => { setShowChat(false); setChatRecipient(null); setChatOrderId(null); }}
        initialRecipient={chatRecipient}
        initialOrderId={chatOrderId}
      />
    </div>
  );
};

export default MyOrders;
