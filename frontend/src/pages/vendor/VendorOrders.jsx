import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChefHat,
  Search,
  RefreshCw,
  User,
  Phone,
  MapPin,
  CreditCard,
  ChevronRight,
  ChevronDown,
  Bell,
  Package,
  Loader2,
  AlertCircle,
  DollarSign,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import './vendor-theme.css';
import './VendorOrders.css';

/* Status configuration aligned with Order model enums — colors come from
   the shared vp-badge variants so this page stays in step with the rest
   of the portal's theme. */
const STATUS_CONFIG = {
  pending:          { label: 'New Order',       badge: 'vp-badge--pending', icon: Clock },
  confirmed:        { label: 'Confirmed',        badge: 'vp-badge--info',    icon: CheckCircle },
  preparing:        { label: 'In Kitchen',       badge: 'vp-badge--brass',   icon: ChefHat },
  out_for_delivery: { label: 'Out for Delivery', badge: 'vp-badge--wine',    icon: Truck },
  delivered:        { label: 'Delivered',        badge: 'vp-badge--success', icon: CheckCircle },
  cancelled:        { label: 'Cancelled',        badge: 'vp-badge--muted',   icon: XCircle },
};

/* Next allowed status transitions for vendor — no emoji, plain labels */
const NEXT_STATUSES = {
  pending:   [{ value: 'confirmed', label: 'Accept Order' }, { value: 'cancelled', label: 'Reject Order' }],
  confirmed: [{ value: 'preparing', label: 'Start Preparing' }, { value: 'cancelled', label: 'Cancel Order' }],
  preparing: [{ value: 'out_for_delivery', label: 'Mark Ready / Send for Delivery' }, { value: 'cancelled', label: 'Cancel Order' }],
  out_for_delivery: [],
  delivered: [],
  cancelled: [],
};

const FILTER_TABS = [
  { value: 'all',              label: 'All' },
  { value: 'pending',          label: 'New' },
  { value: 'confirmed',        label: 'Confirmed' },
  { value: 'preparing',        label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered',        label: 'Delivered' },
  { value: 'cancelled',        label: 'Cancelled' },
];

const VendorOrders = () => {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId]     = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingRejectId, setPendingRejectId] = useState(null);
  const [newOrderIds, setNewOrderIds]   = useState(new Set());

  /* Revenue (merged panel) */
  const [revenueOpen, setRevenueOpen]   = useState(false);
  const [revenueStats, setRevenueStats] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueLoaded, setRevenueLoaded] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true); else setRefreshing(true);
      const res = await api.get('/orders/vendor/my-orders');
      if (res.data.success) {
        const fetched = res.data.data;
        const pendingIds = new Set(fetched.filter(o => o.status === 'pending').map(o => o._id));
        setNewOrderIds(pendingIds);
        setOrders(fetched);
        if (selectedOrder) {
          const updated = fetched.find(o => o._id === selectedOrder._id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedOrder]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRevenue = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const res = await api.get('/orders/vendor/revenue');
      if (res.data.success) {
        setRevenueStats(res.data.data);
        setRevenueLoaded(true);
      }
    } catch (err) {
      toast.error('Failed to load revenue data');
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  const toggleRevenue = () => {
    const next = !revenueOpen;
    setRevenueOpen(next);
    if (next && !revenueLoaded) fetchRevenue();
  };

  /* Update status */
  const updateStatus = async (orderId, newStatus, note = '') => {
    setUpdatingId(orderId);
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus, note });
      if (res.data.success) {
        const cfg = STATUS_CONFIG[newStatus];
        toast.success(`Order marked as "${cfg?.label}"`);
        await fetchOrders(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  /* Quick accept */
  const handleAccept = async (orderId) => {
    setUpdatingId(orderId);
    try {
      await api.post(`/orders/${orderId}/accept`);
      toast.success('Order accepted');
      await fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept order');
    } finally {
      setUpdatingId(null);
    }
  };

  const openRejectModal = (orderId) => {
    setPendingRejectId(orderId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!pendingRejectId) return;
    setUpdatingId(pendingRejectId);
    setShowRejectModal(false);
    try {
      await api.post(`/orders/${pendingRejectId}/reject`, { reason: rejectReason || 'Rejected by restaurant' });
      toast.success('Order rejected');
      await fetchOrders(true);
      if (selectedOrder?._id === pendingRejectId) setSelectedOrder(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject order');
    } finally {
      setUpdatingId(null);
      setPendingRejectId(null);
    }
  };

  const filtered = orders.filter(order => {
    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchSearch =
      order.orderNumber?.toLowerCase().includes(term) ||
      order.customer?.name?.toLowerCase().includes(term) ||
      order.customer?.phone?.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const chartData = revenueStats?.dailyRevenue.map(day => ({
    name: new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' }),
    amount: day.amount,
    orders: day.count
  })) || [];

  if (loading) {
    return (
      <div className="vp-scope vp-loading">
        <Loader2 size={28} className="vp-spin" />
        Loading orders
      </div>
    );
  }

  return (
    <div className="vp-scope fade-in">
      {/* Reject modal */}
      {showRejectModal && (
        <div className="vp-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="vp-modal vp-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="vp-modal-header">
              <div className="vo-modal-title"><AlertCircle size={20} /><h2>Reject order?</h2></div>
              <button className="vp-btn--icon" onClick={() => setShowRejectModal(false)}>&times;</button>
            </div>
            <div className="vp-modal-body">
              <p className="vo-modal-copy">Please provide a reason for rejection (optional).</p>
              <div className="vp-field">
                <label>Reason</label>
                <textarea
                  className="vp-textarea"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Item unavailable, restaurant closing soon..."
                  rows={3}
                />
              </div>
              <div className="vo-modal-actions">
                <button className="vp-btn" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button className="vp-btn vp-btn--primary" onClick={confirmReject}>Reject order</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="vp-page-header">
        <div>
          <span className="vp-eyebrow">Operations</span>
          <h1>
            Order Management
            {pendingCount > 0 && (
              <span className="vp-badge vp-badge--pending vo-pending-alert">
                <Bell size={12} /> {pendingCount} new
              </span>
            )}
          </h1>
          <p>Manage orders and track revenue for your restaurant</p>
          <hr className="vp-rule" />
        </div>
        <button className="vp-btn" onClick={() => fetchOrders(true)} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'vp-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="vo-filter-tabs">
        {FILTER_TABS.map(tab => {
          const count = tab.value === 'all' ? orders.length : orders.filter(o => o.status === tab.value).length;
          return (
            <button
              key={tab.value}
              className={`vo-filter-tab ${statusFilter === tab.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
              {count > 0 && <span className="vo-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="vp-search-box vo-search-box">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by order # or customer name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Split layout: order list + detail panel */}
      <div className="vo-content">
        <div className="vo-list">
          {filtered.length === 0 ? (
            <div className="vp-empty">
              <Package size={40} />
              <p>No orders matching your filter</p>
            </div>
          ) : (
            filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const isNew = newOrderIds.has(order._id);
              const isSelected = selectedOrder?._id === order._id;
              const isUpdating = updatingId === order._id;

              return (
                <div
                  key={order._id}
                  className={`vp-card vo-order-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  {isNew && <span className="vo-new-tag">NEW</span>}
                  <div className="vo-order-top">
                    <div className="vo-order-num-row">
                      <span className="vp-mono vp-cell-primary">#{order.orderNumber}</span>
                      <span className="vp-cell-secondary">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`vp-badge ${cfg.badge}`}>
                      <Icon size={12} /> {cfg.label}
                    </span>
                  </div>
                  <div className="vo-order-mid">
                    <div className="vo-info-row">
                      <User size={13} />
                      <span>{order.customer?.name || 'Customer'}</span>
                    </div>
                    {order.delivery_person_id?.user?.name && (
                      <div className="vo-info-row vo-rider-row">
                        <Truck size={12} />
                        <span>Rider: {order.delivery_person_id.user.name}</span>
                      </div>
                    )}
                    <div className="vo-info-row">
                      <ShoppingBag size={13} />
                      <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      <span className="vo-dot">&bull;</span>
                      <strong className="vp-mono">Rs. {order.total_amount}</strong>
                    </div>
                  </div>
                  {order.status === 'pending' && (
                    <div className="vo-quick-actions" onClick={e => e.stopPropagation()}>
                      <button className="vp-btn vp-btn--primary vo-qa-btn" onClick={() => handleAccept(order._id)} disabled={isUpdating}>
                        {isUpdating ? <Loader2 size={13} className="vp-spin" /> : <CheckCircle size={13} />}
                        Accept
                      </button>
                      <button className="vp-btn vo-qa-btn vo-qa-reject" onClick={() => openRejectModal(order._id)} disabled={isUpdating}>
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}
                  <ChevronRight size={16} className="vo-card-arrow" />
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        <div className="vp-card vo-details-panel">
          {selectedOrder ? (
            <div className="fade-in" key={selectedOrder._id}>
              <div className={`vo-status-bar ${STATUS_CONFIG[selectedOrder.status]?.badge}`}>
                <div className="vo-status-bar-left">
                  <span className="vp-mono">#{selectedOrder.orderNumber}</span>
                  <span className="vo-status-bar-label">{STATUS_CONFIG[selectedOrder.status]?.label}</span>
                </div>
                <span className="vo-status-bar-time">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="vo-detail-section">
                <h3 className="vo-section-title"><User size={15} /> Customer</h3>
                <div className="vo-info-grid">
                  <div className="vo-info-item">
                    <label>Name</label>
                    <span>{selectedOrder.customer?.name || '—'}</span>
                  </div>
                  <div className="vo-info-item">
                    <label><Phone size={12} /> Phone</label>
                    <span>{selectedOrder.customer?.phone || 'Not provided'}</span>
                  </div>
                  <div className="vo-info-item full">
                    <label><MapPin size={12} /> Delivery address</label>
                    <span>
                      {[
                        selectedOrder.delivery_address?.street,
                        selectedOrder.delivery_address?.area,
                        selectedOrder.delivery_address?.city
                      ].filter(Boolean).join(', ') || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedOrder.delivery_person_id && (
                <div className="vo-detail-section">
                  <h3 className="vo-section-title"><Truck size={15} /> Delivery partner</h3>
                  <div className="vo-info-grid">
                    <div className="vo-info-item">
                      <label>Rider name</label>
                      <span>{selectedOrder.delivery_person_id.user?.name || '—'}</span>
                    </div>
                    <div className="vo-info-item">
                      <label><Phone size={12} /> Phone</label>
                      <span>{selectedOrder.delivery_person_id.user?.phone || '—'}</span>
                    </div>
                    <div className="vo-info-item">
                      <label>Vehicle</label>
                      <span className="vo-capitalize">{selectedOrder.delivery_person_id.vehicle_type || '—'}</span>
                    </div>
                    <div className="vo-info-item">
                      <label>License plate</label>
                      <span>{selectedOrder.delivery_person_id.license_plate || '—'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="vo-detail-section">
                <h3 className="vo-section-title"><CreditCard size={15} /> Payment</h3>
                <span className="vp-badge vp-badge--wine">{selectedOrder.paymentMethod?.toUpperCase()}</span>
              </div>

              <div className="vo-detail-section">
                <h3 className="vo-section-title"><ShoppingBag size={15} /> Order items</h3>
                <div className="vo-items-list">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="vo-item-row">
                      <span className="vp-mono vo-item-qty">{item.quantity}&times;</span>
                      <div className="vo-item-name-col">
                        <span className="vo-item-name">{item.name}</span>
                        {item.special_notes && <span className="vo-item-note">Note: {item.special_notes}</span>}
                      </div>
                      <span className="vp-mono vo-item-subtotal">Rs. {item.subtotal}</span>
                    </div>
                  ))}
                </div>
                <div className="vo-totals">
                  <div className="vo-total-row">
                    <span>Subtotal</span>
                    <span className="vp-mono">Rs. {selectedOrder.subtotal}</span>
                  </div>
                  <div className="vo-total-row">
                    <span>Delivery fee</span>
                    <span className="vp-mono">Rs. {selectedOrder.delivery_fee}</span>
                  </div>
                  <div className="vo-total-row vo-grand">
                    <span>Grand total</span>
                    <span className="vp-mono">Rs. {selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>

              {NEXT_STATUSES[selectedOrder.status]?.length > 0 && (
                <div className="vo-detail-section">
                  <h3 className="vo-section-title"><RefreshCw size={15} /> Update status</h3>
                  <div className="vo-action-btns">
                    {NEXT_STATUSES[selectedOrder.status].map(({ value, label }) => {
                      const isCancel = value === 'cancelled';
                      const isUpdating = updatingId === selectedOrder._id;
                      return (
                        <button
                          key={value}
                          className={`vp-btn ${isCancel ? 'vo-qa-reject' : 'vp-btn--primary'}`}
                          onClick={() => {
                            if (isCancel && (selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed')) {
                              openRejectModal(selectedOrder._id);
                            } else {
                              updateStatus(selectedOrder._id, value);
                            }
                          }}
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 size={15} className="vp-spin" /> : null}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedOrder.statusHistory?.length > 0 && (
                <div className="vo-detail-section">
                  <h3 className="vo-section-title"><Clock size={15} /> Timeline</h3>
                  <div className="vo-timeline">
                    {selectedOrder.statusHistory.slice().reverse().map((h, i) => {
                      const cfg = STATUS_CONFIG[h.status] || {};
                      return (
                        <div key={i} className="vo-timeline-item">
                          <span className={`vo-tl-dot ${cfg.badge || ''}`} />
                          <div className="vo-tl-content">
                            <span className={`vo-tl-status ${cfg.badge ? 'vo-tl-status-colored' : ''}`}>{cfg.label || h.status}</span>
                            <span className="vo-tl-note">{h.note}</span>
                            <span className="vo-tl-time">
                              {new Date(h.timestamp).toLocaleString('en-US', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="vo-no-selection">
              <ShoppingBag size={48} strokeWidth={1.2} />
              <p>Select an order to view details and take action</p>
            </div>
          )}
        </div>
      </div>

      {/* Revenue — collapsible panel below the orders table */}
      <div className="vp-card vo-revenue-card">
        <button className="vp-disclosure" onClick={toggleRevenue}>
          <div className="vo-modal-title">
            <DollarSign size={17} />
            <h3>Revenue</h3>
          </div>
          <ChevronDown size={18} className={`vp-disclosure-chevron ${revenueOpen ? 'open' : ''}`} style={{ transform: revenueOpen ? 'rotate(180deg)' : 'none' }} />
        </button>

        <div className={`vp-disclosure-panel ${revenueOpen ? 'open' : ''}`}>
          <div className="vo-revenue-body">
            {revenueLoading && (
              <div className="vp-loading vo-revenue-loading"><Loader2 size={22} className="vp-spin" /> Calculating revenue</div>
            )}

            {!revenueLoading && revenueStats && (
              <>
                <div className="vo-revenue-toolbar">
                  <button className="vp-btn"><Download size={15} /> Export report</button>
                </div>

                <div className="vp-stat-grid vo-revenue-stats">
                  <div className="vp-stat-card">
                    <div className="vp-stat-icon"><DollarSign size={20} /></div>
                    <div>
                      <p className="vp-stat-label">Total earnings</p>
                      <p className="vp-stat-value">Rs. {revenueStats.totalEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="vp-stat-card">
                    <div className="vp-stat-icon"><ShoppingBag size={20} /></div>
                    <div>
                      <p className="vp-stat-label">Total orders</p>
                      <p className="vp-stat-value">{revenueStats.totalOrders}</p>
                    </div>
                  </div>
                </div>

                <div className="vo-revenue-charts">
                  <div className="vp-card vo-chart-card">
                    <div className="vp-card-header vo-chart-header">
                      <h3>Revenue history</h3>
                      <div className="vo-legend"><span className="vo-dot vo-dot--wine" /> Revenue</div>
                    </div>
                    <div className="vp-card-body">
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="voColorAmt" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7a2b28" stopOpacity={0.18} />
                              <stop offset="95%" stopColor="#7a2b28" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4d9c6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a89c8a', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a89c8a', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4d9c6', boxShadow: '0 10px 30px rgba(42,34,28,0.15)', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}
                            cursor={{ stroke: '#7a2b28', strokeWidth: 1, strokeDasharray: '4 4' }}
                          />
                          <Area type="monotone" dataKey="amount" stroke="#7a2b28" strokeWidth={2.5} fillOpacity={1} fill="url(#voColorAmt)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="vp-card vo-chart-card">
                    <div className="vp-card-header"><h3>Orders trend</h3></div>
                    <div className="vp-card-body">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4d9c6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a89c8a', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }} dy={10} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4d9c6', boxShadow: '0 10px 30px rgba(42,34,28,0.15)', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}
                            cursor={{ fill: 'rgba(169,129,62,0.08)' }}
                          />
                          <Bar dataKey="orders" fill="#a9813e" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorOrders;