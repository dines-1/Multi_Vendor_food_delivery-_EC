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
  Loader2,
  Eye,
  X,
  MapPin,
  CreditCard,
  ChefHat,
  Navigation,
  PartyPopper
} from 'lucide-react';
import ReviewModal from '../components/ReviewModal';
import ChatDrawer from '../components/ChatDrawer';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './MyOrders.css';

const STATUS_CONFIG = {
  pending:          { label: 'Order Placed',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: Clock,         step: 0 },
  confirmed:        { label: 'Confirmed',          color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  icon: CheckCircle,   step: 1 },
  preparing:        { label: 'Preparing',          color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: ChefHat,       step: 2 },
  out_for_delivery: { label: 'Out for Delivery',   color: '#6366F1', bg: 'rgba(99,102,241,0.12)', icon: Navigation,    step: 3 },
  delivered:        { label: 'Delivered',          color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle,   step: 4 },
  cancelled:        { label: 'Cancelled',          color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: XCircle,       step: -1 },
};

const TIMELINE_STEPS = [
  { key: 'pending',          label: 'Order Placed',      icon: Package },
  { key: 'confirmed',        label: 'Confirmed',          icon: CheckCircle },
  { key: 'preparing',        label: 'Preparing',          icon: ChefHat },
  { key: 'out_for_delivery', label: 'Out for Delivery',   icon: Navigation },
  { key: 'delivered',        label: 'Delivered',          icon: PartyPopper },
];

/* ─── Order Details Drawer ────────────────────────────────────────── */
const OrderDetailsDrawer = ({ order, onClose, onCancel, onReorder, onRate, onMessage, reviewedOrders, cancellingId }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger open animation
    requestAnimationFrame(() => setMounted(true));
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!order) return null;

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const currentStep = cfg.step;
  const isActive     = ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status);
  const isDelivered  = order.status === 'delivered';
  const isCancelled  = order.status === 'cancelled';
  const isCancellable = ['pending', 'confirmed'].includes(order.status);
  const isReviewed   = reviewedOrders.has(order._id);
  const cancelling   = cancellingId === order._id;

  // Build timestamp map from statusHistory
  const historyMap = {};
  if (order.statusHistory) {
    order.statusHistory.forEach(h => {
      historyMap[h.status] = h.timestamp;
    });
  }

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 320);
  };

  return (
    <div className={`drawer-overlay ${mounted ? 'open' : ''}`} onClick={handleClose}>
      <div
        className={`details-drawer ${mounted ? 'open' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <img
              src={order.restaurant?.logo_url || 'https://via.placeholder.com/44'}
              alt={order.restaurant?.name}
              className="drawer-rest-logo"
            />
            <div>
              <h2 className="drawer-rest-name">{order.restaurant?.name}</h2>
              <span className="drawer-order-num">#{order.orderNumber}</span>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Status Badge */}
        <div className="drawer-status-row">
          <div className="drawer-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
            <cfg.icon size={15} />
            {cfg.label}
          </div>
          <span className="drawer-date">
            <Clock size={13} />
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>

        {/* ── Animated Status Timeline ── */}
        {!isCancelled && (
          <div className="detail-timeline">
            {TIMELINE_STEPS.map((step, idx) => {
              const isCompleted = currentStep > idx;
              const isCurrent   = currentStep === idx;
              const stepCfg     = STATUS_CONFIG[step.key];
              const timestamp   = historyMap[step.key];
              const isLast      = idx === TIMELINE_STEPS.length - 1;

              return (
                <div key={step.key} className="detail-timeline-row">
                  {/* Dot + connector column */}
                  <div className="timeline-col">
                    <div
                      className={`detail-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                      style={isCompleted || isCurrent ? { borderColor: stepCfg.color, background: isCompleted ? stepCfg.color : 'transparent' } : {}}
                    >
                      {isCompleted ? (
                        <CheckCircle size={12} color="#fff" />
                      ) : isCurrent ? (
                        <div className="dot-pulse" style={{ background: stepCfg.color }} />
                      ) : (
                        <div className="dot-empty" />
                      )}
                    </div>
                    {!isLast && (
                      <div className="detail-connector">
                        <div
                          className={`detail-connector-fill ${isCompleted ? 'filled' : ''}`}
                          style={isCompleted ? { background: STATUS_CONFIG[TIMELINE_STEPS[idx + 1]?.key]?.color || '#10B981' } : {}}
                        />
                      </div>
                    )}
                  </div>

                  {/* Label column */}
                  <div className={`timeline-label-col ${isCurrent ? 'current-label' : ''} ${isCompleted ? 'completed-label' : ''}`}>
                    <div className="timeline-step-icon" style={{ color: (isCompleted || isCurrent) ? stepCfg.color : '#4b5563' }}>
                      <step.icon size={16} />
                    </div>
                    <div>
                      <span className="tl-step-name">{step.label}</span>
                      {timestamp && (
                        <span className="tl-step-time">
                          {new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancelled info */}
        {isCancelled && (
          <div className="cancelled-notice">
            <XCircle size={20} />
            <span>This order was cancelled.</span>
          </div>
        )}

        {/* ── Items Table ── */}
        <div className="drawer-section">
          <h3 className="drawer-section-title">
            <ShoppingBag size={16} /> Order Items
          </h3>
          <div className="items-table">
            <div className="items-header">
              <span>Item</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Subtotal</span>
            </div>
            {order.items.map((item, i) => (
              <div key={i} className="items-row">
                <span className="item-name-cell">{item.name}</span>
                <span className="item-qty-cell">×{item.quantity}</span>
                <span className="item-price-cell">Rs. {item.unit_price}</span>
                <span className="item-sub-cell">Rs. {item.subtotal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Price Breakdown ── */}
        <div className="drawer-section">
          <h3 className="drawer-section-title">
            <CreditCard size={16} /> Price Breakdown
          </h3>
          <div className="price-breakdown">
            <div className="price-row">
              <span>Subtotal</span>
              <span>Rs. {order.subtotal}</span>
            </div>
            <div className="price-row">
              <span>Delivery Fee</span>
              <span>Rs. {order.delivery_fee}</span>
            </div>
            <div className="price-row total-row">
              <span>Total</span>
              <span>Rs. {order.total_amount}</span>
            </div>
          </div>
        </div>

        {/* ── Delivery Address ── */}
        {order.delivery_address && (
          <div className="drawer-section">
            <h3 className="drawer-section-title">
              <MapPin size={16} /> Delivery Address
            </h3>
            <div className="address-card">
              <MapPin size={14} color="#f97316" />
              <span>
                {[order.delivery_address.street, order.delivery_address.area, order.delivery_address.city]
                  .filter(Boolean).join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* ── Payment ── */}
        <div className="drawer-section payment-row-section">
          <span className="payment-label">Payment</span>
          <span className="payment-chip">{order.paymentMethod?.toUpperCase()}</span>
        </div>

        {/* ── Action Buttons ── */}
        <div className="drawer-actions">
          {isActive && (
            <Link to={`/track-order/${order._id}`} className="drawer-action-btn primary">
              <Truck size={15} /> Track Live <ChevronRight size={14} />
            </Link>
          )}
          {isCancellable && (
            <button
              className="drawer-action-btn danger"
              onClick={() => onCancel(order._id)}
              disabled={cancelling}
            >
              {cancelling ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />}
              Cancel Order
            </button>
          )}
          {isDelivered && !isReviewed && (
            <button className="drawer-action-btn rate" onClick={() => onRate(order)}>
              <Star size={14} /> Rate Order
            </button>
          )}
          {isDelivered && isReviewed && (
            <span className="drawer-reviewed-badge">
              <Star size={13} fill="currentColor" /> Reviewed
            </span>
          )}
          {isDelivered && (
            <>
              <button className="drawer-action-btn msg" onClick={() => onMessage(order)}>
                <MessageCircle size={14} /> Message
              </button>
              <button className="drawer-action-btn reorder" onClick={() => onReorder(order)}>
                <RotateCcw size={14} /> Reorder
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main MyOrders Component ─────────────────────────────────────── */
const MyOrders = () => {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [showReview, setShowReview]   = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [showChat, setShowChat]       = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [chatOrderId, setChatOrderId] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState(new Set());
  const [selectedOrder, setSelectedOrder] = useState(null);
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
      // Update selected order status if drawer is open
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: 'cancelled' }));
      }
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
              const isActive    = ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status);
              const isDelivered = order.status === 'delivered';
              const isCancellable = ['pending', 'confirmed'].includes(order.status);
              const isReviewed  = reviewedOrders.has(order._id);
              const cancelling  = cancellingId === order._id;

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

                  {/* Mini Status Pipeline */}
                  {order.status !== 'cancelled' && (
                    <div className="order-mini-pipeline">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const stepCfg   = STATUS_CONFIG[step.key];
                        const completed = cfg.step > idx;
                        const current   = cfg.step === idx;
                        const isLast    = idx === TIMELINE_STEPS.length - 1;
                        return (
                          <React.Fragment key={step.key}>
                            <div className="mini-step" title={step.label}>
                              <div
                                className={`mini-dot ${completed ? 'completed' : ''} ${current ? 'current' : ''}`}
                                style={(completed || current) ? { borderColor: stepCfg.color, background: completed ? stepCfg.color : 'transparent' } : {}}
                              >
                                {current && <span className="mini-pulse" style={{ background: stepCfg.color }} />}
                              </div>
                              <span className="mini-label">{step.label}</span>
                            </div>
                            {!isLast && (
                              <div className={`mini-connector ${completed ? 'filled' : ''}`}
                                style={completed ? { background: STATUS_CONFIG[TIMELINE_STEPS[idx + 1]?.key]?.color } : {}}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

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
                      {/* View Details */}
                      <button
                        className="view-details-btn"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye size={14} /> Details
                      </button>

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

      {/* Order Details Drawer */}
      {selectedOrder && (
        <OrderDetailsDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={handleCancel}
          onReorder={handleReorder}
          onRate={handleRateOrder}
          onMessage={handleMessage}
          reviewedOrders={reviewedOrders}
          cancellingId={cancellingId}
        />
      )}

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
