import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package, Clock, CheckCircle, ChefHat, Navigation, MapPin,
    Star, Printer, Eye, ArrowRight, ShoppingBag, Receipt,
    Calendar, Hash, Bike, Utensils, TrendingUp, Search,
    Filter, ChevronDown, AlertCircle, RefreshCw, X
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import ReviewModal from '../components/ReviewModal';
import './Orders.css';

const STATUS_META = {
    pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
    confirmed: { label: 'Confirmed', color: '#3B82F6', bg: '#EFF6FF', icon: CheckCircle },
    preparing: { label: 'Preparing', color: '#8B5CF6', bg: '#F5F3FF', icon: ChefHat },
    out_for_delivery: { label: 'Out for Delivery', color: '#F97316', bg: '#FFF7ED', icon: Bike },
    delivered: { label: 'Delivered', color: '#22C55E', bg: '#F0FDF4', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', icon: X },
};

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery'];
const HISTORY_STATUSES = ['delivered', 'cancelled'];

// ── Receipt Print Component ──────────────────────────────
const ReceiptModal = ({ order, onClose }) => {
    const printRef = useRef();

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank', 'width=480,height=700');
        win.document.write(`
      <html><head><title>Receipt #${order.orderNumber}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Courier New', monospace; background:#fff; color:#111; padding:24px; font-size:13px; }
        .receipt-wrap { max-width: 380px; margin: 0 auto; }
        .r-brand { text-align:center; margin-bottom:16px; }
        .r-brand h2 { font-size:20px; font-weight:900; letter-spacing:2px; }
        .r-brand p  { font-size:11px; color:#666; margin-top:2px; }
        .r-divider { border:none; border-top:1px dashed #ccc; margin:12px 0; }
        .r-row { display:flex; justify-content:space-between; margin:5px 0; font-size:12px; }
        .r-row.bold { font-weight:700; font-size:13px; }
        .r-row.total { font-size:15px; font-weight:900; border-top:2px solid #111; padding-top:8px; margin-top:8px; }
        .r-label { color:#555; }
        .r-items { margin:12px 0; }
        .r-item { display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dotted #eee; }
        .r-footer { text-align:center; margin-top:16px; font-size:11px; color:#888; line-height:1.6; }
        .r-status { text-align:center; font-weight:900; letter-spacing:3px; font-size:14px; margin:12px 0; }
        @media print { body { padding: 0; } }
      </style></head><body>${content}</body></html>
    `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    const items = order.items || [];
    const subtotal = order.total_amount - (order.delivery_fee || 0);

    return (
        <div className="receipt-backdrop" onClick={onClose}>
            <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
                <div className="receipt-modal-header">
                    <h3>Order Receipt</h3>
                    <div className="receipt-modal-actions">
                        <button className="receipt-print-btn" onClick={handlePrint}>
                            <Printer size={16} /> Print
                        </button>
                        <button className="receipt-close-btn" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Printable area */}
                <div ref={printRef}>
                    <div className="receipt-wrap">
                        <div className="r-brand">
                            <h2>🍽️ FOODIE</h2>
                            <p>Kathmandu's Finest Food Delivery</p>
                            <p>support@foodie.com.np · +977-01-XXXXXX</p>
                        </div>
                        <hr className="r-divider" />
                        <div className="r-status">{STATUS_META[order.status]?.label?.toUpperCase() || order.status.toUpperCase()}</div>
                        <hr className="r-divider" />
                        <div className="r-row"><span className="r-label">Order #</span><span>{order.orderNumber || order._id?.slice(-6).toUpperCase()}</span></div>
                        <div className="r-row"><span className="r-label">Date</span><span>{new Date(order.createdAt).toLocaleString('en-NP')}</span></div>
                        <div className="r-row"><span className="r-label">Restaurant</span><span>{order.restaurant?.name}</span></div>
                        <div className="r-row"><span className="r-label">Payment</span><span>{order.payment_method || 'Cash on Delivery'}</span></div>
                        <hr className="r-divider" />
                        <div className="r-items">
                            {items.length > 0 ? items.map((item, i) => (
                                <div className="r-item" key={i}>
                                    <span>{item.name || item.menu_item_id?.name} × {item.quantity}</span>
                                    <span>Rs. {item.price * item.quantity}</span>
                                </div>
                            )) : (
                                <div className="r-item"><span>Items</span><span>—</span></div>
                            )}
                        </div>
                        <hr className="r-divider" />
                        <div className="r-row"><span className="r-label">Subtotal</span><span>Rs. {subtotal}</span></div>
                        <div className="r-row"><span className="r-label">Delivery Fee</span><span>Rs. {order.delivery_fee || 0}</span></div>
                        <div className="r-row total"><span>TOTAL</span><span>Rs. {order.total_amount}</span></div>
                        <hr className="r-divider" />
                        <div className="r-row bold"><span className="r-label">Delivered to</span><span></span></div>
                        <div style={{ fontSize: '12px', color: '#555', margin: '4px 0 12px' }}>
                            {[order.delivery_address?.street, order.delivery_address?.area, order.delivery_address?.city].filter(Boolean).join(', ')}
                        </div>
                        <hr className="r-divider" />
                        <div className="r-footer">
                            <p>Thank you for ordering with Foodie!</p>
                            <p>Rate your experience in the app.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Active Order Card ────────────────────────────────────
const ActiveOrderCard = ({ order, onTrack }) => {
    const meta = STATUS_META[order.status] || STATUS_META.pending;
    const Icon = meta.icon;
    const steps = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    const stepIdx = steps.indexOf(order.status);
    const progressPct = Math.round((stepIdx / (steps.length - 1)) * 100);

    return (
        <div className="active-order-card">
            <div className="aoc-header">
                <div className="aoc-id">
                    <Hash size={13} />
                    <span>{order.orderNumber || order._id?.slice(-6).toUpperCase()}</span>
                </div>
                <span className="aoc-status-badge" style={{ color: meta.color, background: meta.bg }}>
                    <Icon size={13} />
                    {meta.label}
                </span>
            </div>

            <div className="aoc-restaurant">
                <div className="aoc-rest-icon">🍽️</div>
                <div>
                    <strong>{order.restaurant?.name || 'Restaurant'}</strong>
                    <span>{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="aoc-amount">Rs. {order.total_amount}</div>
            </div>

            {/* Progress track */}
            <div className="aoc-progress">
                <div className="aoc-progress-track">
                    <div className="aoc-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="aoc-steps">
                    {steps.slice(0, 4).map((s, i) => {
                        const SM = STATUS_META[s];
                        const SI = SM.icon;
                        return (
                            <div key={s} className={`aoc-step ${i <= stepIdx ? 'done' : ''} ${i === stepIdx ? 'current' : ''}`}>
                                <div className="aoc-step-dot">
                                    <SI size={11} />
                                </div>
                                <span>{SM.label.split(' ').map(w => w[0]).join('')}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="aoc-footer">
                <span className="aoc-time">
                    <Calendar size={13} />
                    {new Date(order.createdAt).toLocaleDateString('en-NP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <button className="aoc-track-btn" onClick={() => onTrack(order._id)}>
                    <Navigation size={15} />
                    Live Track
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

// ── History Order Card ───────────────────────────────────
const HistoryOrderCard = ({ order, onView, onReceipt, onReview }) => {
    const meta = STATUS_META[order.status] || STATUS_META.delivered;
    const Icon = meta.icon;
    const isDelivered = order.status === 'delivered';
    const items = order.items || [];
    const previewItems = items.slice(0, 2);
    const extra = items.length - 2;

    return (
        <div className={`history-card ${order.status === 'cancelled' ? 'cancelled' : ''}`}>
            {/* Left accent stripe */}
            <div className="hc-stripe" style={{ background: meta.color }} />

            <div className="hc-body">
                {/* Top row */}
                <div className="hc-top">
                    <div className="hc-meta">
                        <span className="hc-order-num">
                            <Hash size={12} />{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                        </span>
                        <span className="hc-date">
                            <Calendar size={12} />
                            {new Date(order.createdAt).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    <span className="hc-status" style={{ color: meta.color, background: meta.bg }}>
                        <Icon size={12} />
                        {meta.label}
                    </span>
                </div>

                {/* Restaurant + amount */}
                <div className="hc-main">
                    <div className="hc-rest">
                        <div className="hc-rest-avatar">
                            {order.restaurant?.name?.[0] || 'R'}
                        </div>
                        <div className="hc-rest-info">
                            <strong>{order.restaurant?.name || 'Restaurant'}</strong>
                            <div className="hc-items-preview">
                                {previewItems.map((item, i) => (
                                    <span key={i}>{item.name || item.menu_item_id?.name || 'Item'}</span>
                                ))}
                                {extra > 0 && <span className="hc-extra">+{extra} more</span>}
                            </div>
                        </div>
                    </div>
                    <div className="hc-amount">
                        <strong>Rs. {order.total_amount}</strong>
                        <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* Action row */}
                <div className="hc-actions">
                    <button className="hc-btn hc-btn-outline" onClick={() => onView(order)}>
                        <Eye size={14} />
                        View
                    </button>
                    <button className="hc-btn hc-btn-outline" onClick={() => onReceipt(order)}>
                        <Receipt size={14} />
                        Receipt
                    </button>
                    {isDelivered && (
                        <button className="hc-btn hc-btn-primary" onClick={() => onReview(order)}>
                            <Star size={14} />
                            Rate
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Order Detail Modal ───────────────────────────────────
const OrderDetailModal = ({ order, onClose, onReceipt }) => {
    if (!order) return null;
    const meta = STATUS_META[order.status] || STATUS_META.delivered;
    const Icon = meta.icon;
    const items = order.items || [];

    return (
        <div className="receipt-backdrop" onClick={onClose}>
            <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="receipt-modal-header">
                    <h3>Order Details</h3>
                    <div className="receipt-modal-actions">
                        <button className="receipt-print-btn" onClick={() => onReceipt(order)}>
                            <Receipt size={16} /> Receipt
                        </button>
                        <button className="receipt-close-btn" onClick={onClose}><X size={18} /></button>
                    </div>
                </div>

                <div className="odm-body">
                    {/* Status banner */}
                    <div className="odm-status-banner" style={{ background: meta.bg, borderColor: meta.color + '33' }}>
                        <div className="odm-status-icon" style={{ background: meta.color }}>
                            <Icon size={20} color="#fff" />
                        </div>
                        <div>
                            <strong style={{ color: meta.color }}>{meta.label}</strong>
                            <span>Order #{order.orderNumber || order._id?.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="odm-status-date">
                            {new Date(order.createdAt).toLocaleDateString('en-NP', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    {/* Restaurant */}
                    <div className="odm-section">
                        <h4>Restaurant</h4>
                        <div className="odm-restaurant">
                            <div className="odm-rest-avatar">{order.restaurant?.name?.[0] || 'R'}</div>
                            <strong>{order.restaurant?.name}</strong>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="odm-section">
                        <h4>Items Ordered</h4>
                        <div className="odm-items">
                            {items.length > 0 ? items.map((item, i) => (
                                <div className="odm-item" key={i}>
                                    <span className="odm-item-name">{item.name || item.menu_item_id?.name || 'Item'}</span>
                                    <span className="odm-item-qty">× {item.quantity}</span>
                                    <span className="odm-item-price">Rs. {item.price * item.quantity}</span>
                                </div>
                            )) : <p style={{ color: '#999', fontSize: '14px' }}>No item details available</p>}
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="odm-section">
                        <h4>Payment Summary</h4>
                        <div className="odm-pricing">
                            <div className="odm-price-row"><span>Subtotal</span><span>Rs. {order.total_amount - (order.delivery_fee || 0)}</span></div>
                            <div className="odm-price-row"><span>Delivery Fee</span><span>Rs. {order.delivery_fee || 0}</span></div>
                            <div className="odm-price-row odm-price-total"><span>Total</span><span>Rs. {order.total_amount}</span></div>
                            <div className="odm-price-row"><span>Payment Method</span><span>{order.payment_method || 'Cash on Delivery'}</span></div>
                        </div>
                    </div>

                    {/* Delivery address */}
                    <div className="odm-section">
                        <h4>Delivered To</h4>
                        <div className="odm-address">
                            <MapPin size={16} style={{ color: '#FF5C1A', flexShrink: 0 }} />
                            <span>{[order.delivery_address?.street, order.delivery_address?.area, order.delivery_address?.city].filter(Boolean).join(', ') || 'Address not available'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main Orders Page ─────────────────────────────────────
const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyFilter, setHistoryFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [receiptOrder, setReceiptOrder] = useState(null);
    const [viewOrder, setViewOrder] = useState(null);
    const [reviewOrder, setReviewOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/orders/my-orders');
            setOrders(data.data || []);
        } catch {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
    const historyOrders = orders
        .filter(o => HISTORY_STATUSES.includes(o.status))
        .filter(o => historyFilter === 'all' || o.status === historyFilter)
        .filter(o => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                o.restaurant?.name?.toLowerCase().includes(q) ||
                o.orderNumber?.toLowerCase().includes(q) ||
                o._id?.toLowerCase().includes(q)
            );
        });

    // Stats
    const totalSpent = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total_amount || 0), 0);
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;

    return (
        <div className="orders-page">

            {/* ── PAGE HEADER ── */}
            <div className="orders-header">
                <div className="orders-header-inner">
                    <div className="orders-header-text">
                        <h1>My Orders</h1>
                        <p>Track active deliveries and browse your order history</p>
                    </div>
                    <button className="orders-refresh-btn" onClick={fetchOrders}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                {/* Quick stats */}
                <div className="orders-stats">
                    <div className="ostat">
                        <ShoppingBag size={20} />
                        <div>
                            <strong>{orders.length}</strong>
                            <span>Total Orders</span>
                        </div>
                    </div>
                    <div className="ostat">
                        <Bike size={20} />
                        <div>
                            <strong>{activeOrders.length}</strong>
                            <span>Active Now</span>
                        </div>
                    </div>
                    <div className="ostat">
                        <CheckCircle size={20} />
                        <div>
                            <strong>{deliveredCount}</strong>
                            <span>Delivered</span>
                        </div>
                    </div>
                    <div className="ostat ostat-highlight">
                        <TrendingUp size={20} />
                        <div>
                            <strong>Rs. {totalSpent.toLocaleString()}</strong>
                            <span>Total Spent</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="orders-body">

                {/* ══════════════════════════════════════════
            SECTION 1 — ACTIVE ORDERS
        ══════════════════════════════════════════ */}
                <section className="orders-section">
                    <div className="orders-section-header">
                        <div className="osh-left">
                            <span className="osh-live-dot" />
                            <h2>Active Orders</h2>
                            {activeOrders.length > 0 && (
                                <span className="osh-count">{activeOrders.length}</span>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="active-orders-grid">
                            {[1, 2].map(i => <div className="skeleton aoc-skeleton" key={i} />)}
                        </div>
                    ) : activeOrders.length === 0 ? (
                        <div className="empty-state-inline">
                            <div className="esi-icon"><Bike size={28} /></div>
                            <div>
                                <strong>No active orders</strong>
                                <span>Your in-progress orders will appear here</span>
                            </div>
                            <button className="esi-cta" onClick={() => navigate('/explore')}>
                                Order now <ArrowRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="active-orders-grid">
                            {activeOrders.map(order => (
                                <ActiveOrderCard
                                    key={order._id}
                                    order={order}
                                    onTrack={(id) => navigate(`/track-order/${id}`)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ══════════════════════════════════════════
            SECTION 2 — ORDER HISTORY
        ══════════════════════════════════════════ */}
                <section className="orders-section">
                    <div className="orders-section-header">
                        <div className="osh-left">
                            <h2>Order History</h2>
                            {historyOrders.length > 0 && (
                                <span className="osh-count osh-count--muted">{historyOrders.length}</span>
                            )}
                        </div>
                        {/* Filter + Search */}
                        <div className="history-controls">
                            <div className="history-search">
                                <Search size={15} />
                                <input
                                    type="text"
                                    placeholder="Search orders…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="history-filter">
                                {['all', 'delivered', 'cancelled'].map(f => (
                                    <button
                                        key={f}
                                        className={`hf-btn ${historyFilter === f ? 'active' : ''}`}
                                        onClick={() => setHistoryFilter(f)}
                                    >
                                        {f === 'all' ? 'All' : STATUS_META[f]?.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="history-grid">
                            {[1, 2, 3].map(i => <div className="skeleton hc-skeleton" key={i} />)}
                        </div>
                    ) : historyOrders.length === 0 ? (
                        <div className="empty-state-inline">
                            <div className="esi-icon"><Receipt size={28} /></div>
                            <div>
                                <strong>No orders found</strong>
                                <span>
                                    {searchQuery ? 'Try a different search term' : 'Completed orders will show here'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="history-grid">
                            {historyOrders.map(order => (
                                <HistoryOrderCard
                                    key={order._id}
                                    order={order}
                                    onView={setViewOrder}
                                    onReceipt={setReceiptOrder}
                                    onReview={setReviewOrder}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* ── MODALS ── */}
            {receiptOrder && (
                <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
            )}
            {viewOrder && (
                <OrderDetailModal
                    order={viewOrder}
                    onClose={() => setViewOrder(null)}
                    onReceipt={(o) => { setViewOrder(null); setReceiptOrder(o); }}
                />
            )}
            {reviewOrder && (
                <ReviewModal
                    isOpen={!!reviewOrder}
                    onClose={(submitted) => {
                        setReviewOrder(null);
                        if (submitted) toast.success('Thanks for your review!');
                    }}
                    orderId={reviewOrder._id}
                    restaurantName={reviewOrder.restaurant?.name}
                />
            )}
        </div>
    );
};

export default Orders;