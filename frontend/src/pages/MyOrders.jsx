import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
  Package, Clock, Star, RotateCcw, XCircle, CheckCircle,
  ShoppingBag, Loader2, Eye, X, MapPin, CreditCard, ChefHat,
  Navigation, PartyPopper, Timer, AlertCircle, Printer,
  Receipt, Hash, Calendar, Bike, TrendingUp, ArrowRight,
  RefreshCw, ChevronRight,
} from 'lucide-react';
import ReviewModal from '../components/ReviewModal';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { fallbackRestaurantImage, resolveMediaUrl } from '../utils/customerData';
import './MyOrders.css';

/* ── Status config ─────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: { label: 'Order Placed', color: '#F59E0B', bg: 'rgba(245,158,11,.12)', icon: Clock, step: 0 },
  confirmed: { label: 'Confirmed', color: '#3B82F6', bg: 'rgba(59,130,246,.12)', icon: CheckCircle, step: 1 },
  preparing: { label: 'Preparing', color: '#8B5CF6', bg: 'rgba(139,92,246,.12)', icon: ChefHat, step: 2 },
  out_for_delivery: { label: 'Out for Delivery', color: '#F97316', bg: 'rgba(249,115,22,.12)', icon: Bike, step: 3 },
  delivered: { label: 'Delivered', color: '#22C55E', bg: 'rgba(34,197,94,.12)', icon: CheckCircle, step: 4 },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: 'rgba(239,68,68,.12)', icon: XCircle, step: -1 },
};

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'out_for_delivery', label: 'On the Way', icon: Bike },
  { key: 'delivered', label: 'Delivered', icon: PartyPopper },
];

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery'];
const HISTORY_STATUSES = ['delivered', 'cancelled'];

/* ── Countdown timer ───────────────────────────────────── */
const OrderCountdown = ({ createdAt, onTimeout }) => {
  const calc = useCallback(() => {
    const total = (new Date(createdAt).getTime() + 10 * 60 * 1000) - Date.now();
    return { total, minutes: Math.max(0, Math.floor(total / 60000)), seconds: Math.max(0, Math.floor((total / 1000) % 60)) };
  }, [createdAt]);
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => { const r = calc(); setT(r); if (r.total <= 0) { clearInterval(id); onTimeout?.(); } }, 1000);
    return () => clearInterval(id);
  }, [calc, onTimeout]);
  const pad = (n) => String(n).padStart(2, '0');
  if (t.total <= 0) return <div className="countdown expired"><AlertCircle size={13} /><span>Waiting on restaurant…</span></div>;
  return (
    <div className={`countdown ${t.total < 120000 ? 'urgent' : ''}`}>
      <Timer size={13} /><span>Restaurant has <strong>{pad(t.minutes)}:{pad(t.seconds)}</strong> to accept</span>
    </div>
  );
};

/* ── Payment info helper ───────────────────────────────── */
const paymentInfo = (order) => {
  if (order.status === 'cancelled') return order.paymentMethod === 'cash'
    ? { label: 'No charge', color: '#EF4444', bg: 'rgba(239,68,68,.1)' }
    : { label: 'Refunded', color: '#22C55E', bg: 'rgba(34,197,94,.1)' };
  if (order.paymentMethod === 'cash')
    return order.status === 'delivered'
      ? { label: 'COD – Collected', color: '#22C55E', bg: 'rgba(34,197,94,.1)' }
      : { label: 'COD – On Delivery', color: '#F59E0B', bg: 'rgba(245,158,11,.1)' };
  return { label: `Paid · ${order.paymentMethod?.toUpperCase()}`, color: '#22C55E', bg: 'rgba(34,197,94,.1)' };
};

/* ══════════════════════════════════════════════════════════
   RECEIPT MODAL
══════════════════════════════════════════════════════════ */
const ReceiptModal = ({ order, onClose }) => {
  const printRef = useRef();
  const print = () => {
    const win = window.open('', '_blank', 'width=480,height=700');
    win.document.write(`<html><head><title>Receipt #${order.orderNumber}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;background:#fff;color:#111;padding:24px;font-size:13px}
    .rw{max-width:380px;margin:0 auto}.rb{text-align:center;margin-bottom:16px}.rb h2{font-size:20px;font-weight:900;letter-spacing:2px}
    .rb p{font-size:11px;color:#777;margin-top:3px}.rd{border:none;border-top:1px dashed #ccc;margin:12px 0}
    .rs{text-align:center;font-weight:900;letter-spacing:3px;font-size:13px;margin:8px 0}
    .rr{display:flex;justify-content:space-between;margin:5px 0;font-size:12px}.rr.bold{font-weight:700;font-size:13px}
    .rr.total{font-size:15px;font-weight:900;border-top:2px solid #111;padding-top:8px;margin-top:8px}
    .rl{color:#666}.ri{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dotted #eee;font-size:12px}
    .rf{text-align:center;margin-top:16px;font-size:11px;color:#999;line-height:1.7}@media print{body{padding:0}}</style>
    </head><body>${printRef.current.innerHTML}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };
  const items = order.items || [];
  const subtotal = order.subtotal || (order.total_amount - (order.delivery_fee || 0));
  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-modal mo-receipt-modal" onClick={e => e.stopPropagation()}>
        <div className="mo-modal-header">
          <h3>Receipt</h3>
          <div className="mo-modal-actions">
            <button className="mo-print-btn" onClick={print}><Printer size={15} /> Print</button>
            <button className="mo-close-btn" onClick={onClose}><X size={17} /></button>
          </div>
        </div>
        <div ref={printRef}>
          <div className="rw">
            <div className="rb"><h2>🍽️ FOODIE</h2><p>Kathmandu's Finest Food Delivery</p><p>support@foodie.com.np</p></div>
            <hr className="rd" />
            <div className="rs">{STATUS_CONFIG[order.status]?.label?.toUpperCase()}</div>
            <hr className="rd" />
            <div className="rr"><span className="rl">Order #</span><span>{order.orderNumber || order._id?.slice(-6).toUpperCase()}</span></div>
            <div className="rr"><span className="rl">Date</span><span>{new Date(order.createdAt).toLocaleString('en-NP')}</span></div>
            <div className="rr"><span className="rl">Restaurant</span><span>{order.restaurant?.name}</span></div>
            <div className="rr"><span className="rl">Payment</span><span>{order.paymentMethod?.toUpperCase() || 'Cash'}</span></div>
            <hr className="rd" />
            <div style={{ margin: '10px 0' }}>
              {items.map((item, i) => (
                <div className="ri" key={i}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>Rs. {item.subtotal || item.unit_price * item.quantity}</span>
                </div>
              ))}
            </div>
            <hr className="rd" />
            <div className="rr"><span className="rl">Subtotal</span><span>Rs. {subtotal}</span></div>
            <div className="rr"><span className="rl">Delivery</span><span>Rs. {order.delivery_fee || 0}</span></div>
            <div className="rr total"><span>TOTAL</span><span>Rs. {order.total_amount}</span></div>
            <hr className="rd" />
            <div style={{ fontSize: '12px', color: '#555', margin: '4px 0 12px' }}>
              {[order.delivery_address?.street, order.delivery_address?.area, order.delivery_address?.city].filter(Boolean).join(', ')}
            </div>
            <hr className="rd" />
            <div className="rf"><p>Thank you for ordering with Foodie!</p><p>Rate your experience in the app.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   ORDER DETAILS DRAWER  (existing, kept + enhanced)
══════════════════════════════════════════════════════════ */
const OrderDetailsDrawer = ({ order, onClose, onCancel, onReorder, onRate, onReceipt, reviewedOrders, cancellingId }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  if (!order) return null;
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const currentStep = cfg.step;
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const isCancellable = ['pending', 'confirmed'].includes(order.status);
  const isReviewed = reviewedOrders.has(order._id);
  const cancelling = cancellingId === order._id;
  const historyMap = {};
  (order.statusHistory || []).forEach(h => { historyMap[h.status] = h.timestamp; });
  const handleClose = () => { setMounted(false); setTimeout(onClose, 320); };

  return (
    <div className={`drawer-overlay ${mounted ? 'open' : ''}`} onClick={handleClose}>
      <div className={`details-drawer ${mounted ? 'open' : ''}`} onClick={e => e.stopPropagation()}>

        <div className="drawer-header">
          <div className="drawer-title-group">
            <img src={resolveMediaUrl(order.restaurant?.logo_url, fallbackRestaurantImage)} alt={order.restaurant?.name} className="drawer-rest-logo" />
            <div>
              <h2 className="drawer-rest-name">{order.restaurant?.name}</h2>
              <span className="drawer-order-num">#{order.orderNumber}</span>
            </div>
          </div>
          <div className="drawer-header-actions">
            <button className="mo-print-btn" onClick={() => onReceipt(order)}><Receipt size={14} /> Receipt</button>
            <button className="drawer-close-btn" onClick={handleClose}><X size={20} /></button>
          </div>
        </div>

        <div className="drawer-status-row">
          <div className="drawer-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
            <cfg.icon size={15} /> {cfg.label}
          </div>
          <span className="drawer-date"><Clock size={13} />{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="drawer-payment-pill-row">
          <span className="pm-label">Payment:</span>
          <span className="pm-method-pill">{order.paymentMethod?.toUpperCase()}</span>
          {(() => { const p = paymentInfo(order); return <span className="pm-status-pill" style={{ color: p.color, background: p.bg }}>{p.label}</span>; })()}
        </div>

        {!isCancelled && (
          <div className="detail-timeline">
            {TIMELINE_STEPS.map((step, idx) => {
              const isCompleted = currentStep > idx;
              const isCurrent = currentStep === idx;
              const stepCfg = STATUS_CONFIG[step.key];
              const timestamp = historyMap[step.key];
              const isLast = idx === TIMELINE_STEPS.length - 1;
              return (
                <div key={step.key} className="detail-timeline-row">
                  <div className="timeline-col">
                    <div className={`detail-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                      style={(isCompleted || isCurrent) ? { borderColor: stepCfg.color, background: isCompleted ? stepCfg.color : 'transparent' } : {}}>
                      {isCompleted ? <CheckCircle size={12} color="#fff" /> : isCurrent ? <div className="dot-pulse" style={{ background: stepCfg.color }} /> : <div className="dot-empty" />}
                    </div>
                    {!isLast && (
                      <div className="detail-connector">
                        <div className={`detail-connector-fill ${isCompleted ? 'filled' : ''}`}
                          style={isCompleted ? { background: STATUS_CONFIG[TIMELINE_STEPS[idx + 1]?.key]?.color || '#22C55E' } : {}} />
                      </div>
                    )}
                  </div>
                  <div className={`timeline-label-col ${isCurrent ? 'current-label' : ''} ${isCompleted ? 'completed-label' : ''}`}>
                    <div className="timeline-step-icon" style={{ color: (isCompleted || isCurrent) ? stepCfg.color : '#6b7280' }}><step.icon size={16} /></div>
                    <div>
                      <span className="tl-step-name">{step.label}</span>
                      {timestamp && <span className="tl-step-time">{new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isCancelled && (
          <div className="cancelled-notice">
            <XCircle size={20} />
            <div><strong>Order Cancelled</strong>
              <p className="cancelled-explanation">{order.statusHistory?.find(h => h.status === 'cancelled')?.note || 'The order has been cancelled.'}</p>
            </div>
          </div>
        )}

        <div className="drawer-section">
          <h3 className="drawer-section-title"><ShoppingBag size={16} /> Order Items</h3>
          <div className="items-table">
            <div className="items-header"><span>Item</span><span>Qty</span><span>Price</span><span>Subtotal</span></div>
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

        <div className="drawer-section">
          <h3 className="drawer-section-title"><CreditCard size={16} /> Price Breakdown</h3>
          <div className="price-breakdown">
            <div className="price-row"><span>Subtotal</span><span>Rs. {order.subtotal}</span></div>
            <div className="price-row"><span>Delivery Fee</span><span>Rs. {order.delivery_fee}</span></div>
            <div className="price-row total-row"><span>Total</span><span>Rs. {order.total_amount}</span></div>
          </div>
        </div>

        {order.delivery_address && (
          <div className="drawer-section">
            <h3 className="drawer-section-title"><MapPin size={16} /> Delivery Address</h3>
            <div className="address-card">
              <MapPin size={14} color="#f97316" />
              <span>{[order.delivery_address.street, order.delivery_address.area, order.delivery_address.city].filter(Boolean).join(', ')}</span>
            </div>
          </div>
        )}

        <div className="drawer-actions">
          {isCancellable && (
            <button className="drawer-action-btn danger" onClick={() => onCancel(order._id)} disabled={cancelling}>
              {cancelling ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />} Cancel
            </button>
          )}
          {isDelivered && !isReviewed && (
            <button className="drawer-action-btn rate" onClick={() => onRate(order)}><Star size={14} /> Rate Order</button>
          )}
          {isDelivered && isReviewed && (
            <span className="drawer-reviewed-badge"><Star size={13} fill="currentColor" /> Reviewed</span>
          )}
          {isDelivered && (
            <button className="drawer-action-btn reorder" onClick={() => onReorder(order)}><RotateCcw size={14} /> Reorder</button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   ACTIVE ORDER CARD
══════════════════════════════════════════════════════════ */
const ActiveCard = ({ order, onOpen, onCancel, cancellingId }) => {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const steps = ['pending', 'confirmed', 'preparing', 'out_for_delivery'];
  const stepIdx = steps.indexOf(order.status);
  const pct = Math.round((stepIdx / (steps.length - 1)) * 100);
  const cancelling = cancellingId === order._id;

  return (
    <div className="ac-card">
      {order.status === 'pending' && <OrderCountdown createdAt={order.createdAt} />}

      <div className="ac-header">
        <div className="ac-rest">
          <img src={resolveMediaUrl(order.restaurant?.logo_url, fallbackRestaurantImage)} alt="" className="ac-logo" />
          <div>
            <strong>{order.restaurant?.name}</strong>
            <span className="ac-num"><Hash size={11} />{order.orderNumber}</span>
          </div>
        </div>
        <span className="ac-badge" style={{ color: cfg.color, background: cfg.bg }}><Icon size={13} />{cfg.label}</span>
      </div>

      {/* Progress bar */}
      <div className="ac-progress">
        <div className="ac-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Steps row */}
      <div className="ac-steps">
        {TIMELINE_STEPS.slice(0, 4).map((s, i) => {
          const sc = STATUS_CONFIG[s.key];
          return (
            <div key={s.key} className={`ac-step ${i <= stepIdx ? 'done' : ''} ${i === stepIdx ? 'cur' : ''}`}>
              <div className="ac-step-dot" style={i === stepIdx ? { background: sc.color, boxShadow: `0 0 0 5px ${sc.bg}` } : i < stepIdx ? { background: sc.color } : {}}>
                {i <= stepIdx && <CheckCircle size={10} color="#fff" />}
              </div>
              <span>{sc.label.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>

      {/* Items chips */}
      <div className="ac-items">
        {order.items.slice(0, 3).map((item, i) => (
          <span key={i} className="ac-chip"><strong>{item.quantity}×</strong> {item.name}</span>
        ))}
        {order.items.length > 3 && <span className="ac-chip ac-chip-more">+{order.items.length - 3} more</span>}
      </div>

      <div className="ac-footer">
        <div className="ac-amount">
          <span>Total</span>
          <strong>Rs. {order.total_amount}</strong>
        </div>
        <div className="ac-btns">
          {['pending', 'confirmed'].includes(order.status) && (
            <button className="ac-btn ac-btn-cancel" onClick={() => onCancel(order._id)} disabled={cancelling}>
              {cancelling ? <Loader2 size={13} className="spin" /> : <XCircle size={13} />} Cancel
            </button>
          )}
          <button className="ac-btn ac-btn-primary" onClick={() => onOpen(order)}>
            <Eye size={13} /> Details <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   HISTORY CARD  (redesigned)
══════════════════════════════════════════════════════════ */
const HistoryCard = ({ order, onOpen, onReceipt, onRate, onReorder, reviewedOrders }) => {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.delivered;
  const Icon = cfg.icon;
  const isDelivered = order.status === 'delivered';
  const isReviewed = reviewedOrders.has(order._id);
  const pi = paymentInfo(order);
  const previewItems = order.items.slice(0, 2);
  const extra = order.items.length - 2;

  return (
    <div className={`hc-card ${order.status === 'cancelled' ? 'hc-cancelled' : ''}`}>
      <div className="hc-stripe" style={{ background: cfg.color }} />
      <div className="hc-inner">

        {/* Top row */}
        <div className="hc-top">
          <div className="hc-top-left">
            <div className="hc-avatar" style={{ background: `${cfg.color}22`, color: cfg.color }}>
              {order.restaurant?.name?.[0] || 'R'}
            </div>
            <div>
              <strong className="hc-rest-name">{order.restaurant?.name}</strong>
              <div className="hc-meta-row">
                <span className="hc-num"><Hash size={11} />{order.orderNumber}</span>
                <span className="hc-dot-sep">·</span>
                <span className="hc-date"><Calendar size={11} />{new Date(order.createdAt).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <span className="hc-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
            <Icon size={12} />{cfg.label}
          </span>
        </div>

        {/* Items */}
        <div className="hc-items-row">
          {previewItems.map((item, i) => (
            <span key={i} className="hc-item-chip">{item.quantity}× {item.name}</span>
          ))}
          {extra > 0 && <span className="hc-item-chip hc-chip-more">+{extra} more</span>}
        </div>

        {/* Bottom row */}
        <div className="hc-bottom">
          <div className="hc-amount-col">
            <strong className="hc-amount">Rs. {order.total_amount}</strong>
            <span className="hc-pay-pill" style={{ color: pi.color, background: pi.bg }}>{pi.label}</span>
          </div>
          <div className="hc-actions">
            <button className="hc-btn hc-outline" onClick={() => onOpen(order)}><Eye size={13} /> View</button>
            <button className="hc-btn hc-outline" onClick={() => onReceipt(order)}><Receipt size={13} /> Receipt</button>
            {isDelivered && !isReviewed && (
              <button className="hc-btn hc-rate" onClick={() => onRate(order)}><Star size={13} /> Rate</button>
            )}
            {isDelivered && isReviewed && (
              <span className="hc-reviewed"><Star size={12} fill="currentColor" /> Reviewed</span>
            )}
            {isDelivered && (
              <button className="hc-btn hc-reorder" onClick={() => onReorder(order)}><RotateCcw size={13} /> Reorder</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState(new Set());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const { addToCart } = useCart();

  const fetchOrders = useCallback(async () => {
    try { setLoading(true); const res = await api.get('/orders/my-orders'); setOrders(res.data.data || []); }
    catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
      if (selectedOrder?._id === orderId) setSelectedOrder(p => ({ ...p, status: 'cancelled' }));
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot cancel'); }
    finally { setCancellingId(null); }
  };

  const handleReorder = async (order) => {
    let added = 0;
    for (const item of order.items) {
      if (item.menuItem) { const r = await addToCart(item.menuItem._id || item.menuItem, item.quantity); if (r?.success) added++; }
    }
    if (added > 0) toast.success(`${added} item(s) added to cart!`);
  };

  const handleRate = (order) => { setReviewOrder(order); setShowReview(true); };
  const handleReviewClose = (submitted) => {
    setShowReview(false);
    if (submitted && reviewOrder) setReviewedOrders(p => new Set([...p, reviewOrder._id]));
    setReviewOrder(null);
  };

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const historyOrders = orders
    .filter(o => HISTORY_STATUSES.includes(o.status))
    .filter(o => historyFilter === 'all' || o.status === historyFilter)
    .filter(o => {
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      return o.restaurant?.name?.toLowerCase().includes(q) || o.orderNumber?.toLowerCase().includes(q);
    });

  const totalSpent = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total_amount || 0), 0);
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  if (loading) return (
    <div className="mo-loading"><Loader2 size={36} className="spin" /><p>Loading your orders…</p></div>
  );

  return (
    <div className="mo-page">

      {/* ── HEADER ── */}
      <div className="mo-header">
        <div className="mo-header-inner">
          <div>
            <h1>My Orders</h1>
            <p>Track active deliveries and browse your history</p>
          </div>
          <button className="mo-refresh" onClick={fetchOrders}><RefreshCw size={15} /> Refresh</button>
        </div>
        <div className="mo-stats">
          {[
            { icon: <ShoppingBag size={18} />, val: orders.length, label: 'Total Orders' },
            { icon: <Bike size={18} />, val: activeOrders.length, label: 'Active Now', accent: true },
            { icon: <CheckCircle size={18} />, val: deliveredCount, label: 'Delivered' },
            { icon: <TrendingUp size={18} />, val: `Rs. ${totalSpent.toLocaleString()}`, label: 'Total Spent' },
          ].map((s, i) => (
            <div key={i} className={`mo-stat ${s.accent && activeOrders.length > 0 ? 'mo-stat-accent' : ''}`}>
              {s.icon}<div><strong>{s.val}</strong><span>{s.label}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mo-body">

        {/* ══════════════════════════════════════
            SECTION 1 — ACTIVE ORDERS
        ══════════════════════════════════════ */}
        <section className="mo-section">
          <div className="mo-section-head">
            <div className="mo-sh-left">
              <span className="mo-live-dot" />
              <h2>Active Orders</h2>
              {activeOrders.length > 0 && <span className="mo-badge">{activeOrders.length}</span>}
            </div>
          </div>

          {activeOrders.length === 0 ? (
            <div className="mo-empty-inline">
              <div className="mo-empty-icon"><Bike size={24} /></div>
              <div><strong>No active orders</strong><span>In-progress orders will appear here</span></div>
              <Link to="/" className="mo-empty-cta">Order food <ArrowRight size={13} /></Link>
            </div>
          ) : (
            <div className="ac-grid">
              {activeOrders.map(o => (
                <ActiveCard key={o._id} order={o} onOpen={setSelectedOrder} onCancel={handleCancel} cancellingId={cancellingId} />
              ))}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════
            SECTION 2 — ORDER HISTORY
        ══════════════════════════════════════ */}
        <section className="mo-section">
          <div className="mo-section-head mo-sh-wrap">
            <div className="mo-sh-left">
              <h2>Order History</h2>
              {historyOrders.length > 0 && <span className="mo-badge mo-badge-muted">{historyOrders.length}</span>}
            </div>
            <div className="mo-history-controls">
              <input
                className="mo-search"
                type="text"
                placeholder="Search orders…"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
              />
              <div className="mo-filters">
                {['all', 'delivered', 'cancelled'].map(f => (
                  <button key={f} className={`mo-filter-btn ${historyFilter === f ? 'active' : ''}`} onClick={() => setHistoryFilter(f)}>
                    {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {historyOrders.length === 0 ? (
            <div className="mo-empty-inline">
              <div className="mo-empty-icon"><Receipt size={24} /></div>
              <div>
                <strong>No orders found</strong>
                <span>{historySearch ? 'Try a different search' : 'Completed orders appear here'}</span>
              </div>
            </div>
          ) : (
            <div className="hc-list">
              {historyOrders.map(o => (
                <HistoryCard
                  key={o._id}
                  order={o}
                  onOpen={setSelectedOrder}
                  onReceipt={setReceiptOrder}
                  onRate={handleRate}
                  onReorder={handleReorder}
                  reviewedOrders={reviewedOrders}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── MODALS / DRAWER ── */}
      {selectedOrder && (
        <OrderDetailsDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={handleCancel}
          onReorder={handleReorder}
          onRate={handleRate}
          onReceipt={(o) => { setSelectedOrder(null); setReceiptOrder(o); }}
          reviewedOrders={reviewedOrders}
          cancellingId={cancellingId}
        />
      )}
      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
      <ReviewModal
        isOpen={showReview}
        onClose={handleReviewClose}
        orderId={reviewOrder?._id}
        restaurantName={reviewOrder?.restaurant?.name}
      />
    </div>
  );
};

export default MyOrders;
