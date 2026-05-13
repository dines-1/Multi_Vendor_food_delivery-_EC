import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Package,
  Clock,
  ChevronRight,
  Star,
  MessageCircle,
  RotateCcw,
  XCircle,
  CheckCircle,
  Truck,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import ReviewModal from '../components/ReviewModal';
import ChatDrawer from '../components/ChatDrawer';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './MyOrders.css';

const STATUS_CONFIG = {
  pending:          { label: 'Order Placed',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: Clock },
  confirmed:        { label: 'Confirmed',          color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  icon: CheckCircle },
  preparing:        { label: 'Preparing',          color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: ShoppingBag },
  out_for_delivery: { label: 'Out for Delivery',   color: '#6366F1', bg: 'rgba(99,102,241,0.12)', icon: Truck },
  delivered:        { label: 'Delivered',          color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  cancelled:        { label: 'Cancelled',          color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: XCircle },
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [chatOrderId, setChatOrderId] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState(new Set());
  const { addToCart } = useCart();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = async (order) => {
    let added = 0;
    for (const item of order.items) {
      if (item.menuItem) {
        const result = await addToCart(item.menuItem._id || item.menuItem, item.quantity);
        if (result?.success) added++;
      }
    }
    if (added > 0) toast.success(`${added} item(s) added to cart!`);
  };

  const handleRateOrder = (order) => { setReviewOrder(order); setShowReview(true); };
  const handleReviewClose = (submitted) => {
    setShowReview(false);
    if (submitted && reviewOrder) {
      setReviewedOrders(prev => new Set([...prev, reviewOrder._id]));
    }
    setReviewOrder(null);
  };

  const handleMessage = (order) => {
    setChatRecipient({ _id: order.restaurant?.owner || order.restaurant?._id, name: order.restaurant?.name });
    setChatOrderId(order._id);
    setShowChat(true);
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <Loader2 size={40} className="spin" />
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p className="orders-subtitle">{orders.length} total order{orders.length !== 1 ? 's' : ''}</p>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <Package size={64} strokeWidth={1.2} />
            <h2>No orders yet</h2>
            <p>You haven't placed any orders yet. Start exploring!</p>
            <Link to="/" className="btn-primary">Browse Restaurants</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const isActive   = ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status);
              const isDelivered = order.status === 'delivered';
              const isCancellable = ['pending', 'confirmed'].includes(order.status);
              const isReviewed = reviewedOrders.has(order._id);
              const cancelling = cancellingId === order._id;

              return (
                <div key={order._id} className="order-card">
                  {/* Header */}
                  <div className="order-header">
                    <div className="restaurant-info">
                      <img
                        src={order.restaurant?.logo_url || 'https://via.placeholder.com/50'}
                        alt={order.restaurant?.name}
                        className="restaurant-logo"
                      />
                      <div>
                        <h3>{order.restaurant?.name}</h3>
                        <p className="order-num">#{order.orderNumber}</p>
                      </div>
                    </div>
                    <div
                      className="order-status-badge"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      <Icon size={14} />
                      {cfg.label}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="order-body">
                    <div className="order-items-list">
                      {order.items.map((item, i) => (
                        <span key={i} className="order-item-chip">
                          {item.quantity}× {item.name}
                        </span>
                      ))}
                    </div>
                    <div className="order-meta">
                      <span>
                        <Clock size={14} />
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <span className="payment-chip">{order.paymentMethod?.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="order-footer">
                    <div className="order-total-display">
                      Rs. {order.total_amount}
                    </div>
                    <div className="order-actions">
                      {isActive && (
                        <Link to={`/track-order/${order._id}`} className="track-btn">
                          Track Live <ChevronRight size={14} />
                        </Link>
                      )}
                      {isCancellable && (
                        <button
                          className="cancel-order-btn"
                          onClick={() => handleCancel(order._id)}
                          disabled={cancelling}
                        >
                          {cancelling ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />}
                          Cancel
                        </button>
                      )}
                      {isDelivered && !isReviewed && (
                        <button className="rate-btn" onClick={() => handleRateOrder(order)}>
                          <Star size={14} /> Rate
                        </button>
                      )}
                      {isDelivered && isReviewed && (
                        <span className="reviewed-badge">
                          <Star size={13} fill="currentColor" /> Reviewed
                        </span>
                      )}
                      {isDelivered && (
                        <>
                          <button className="msg-btn" onClick={() => handleMessage(order)}>
                            <MessageCircle size={14} />
                          </button>
                          <button className="reorder-btn" onClick={() => handleReorder(order)}>
                            <RotateCcw size={14} /> Reorder
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

      <ReviewModal
        isOpen={showReview}
        onClose={handleReviewClose}
        orderId={reviewOrder?._id}
        restaurantName={reviewOrder?.restaurant?.name}
      />
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
