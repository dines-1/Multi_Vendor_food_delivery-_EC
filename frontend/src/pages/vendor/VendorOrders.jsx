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
  Filter,
  Search,
  RefreshCw,
  User,
  Phone,
  MapPin,
  CreditCard,
  ChevronRight,
  Bell,
  Package,
  Loader2,
  AlertCircle
} from 'lucide-react';
import './VendorOrders.css';

/* ── Status configuration aligned with Order model enums ── */
const STATUS_CONFIG = {
  pending:          { label: 'New Order',       color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  icon: Clock,        border: '#F59E0B' },
  confirmed:        { label: 'Confirmed',        color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', icon: CheckCircle,  border: '#3B82F6' },
  preparing:        { label: 'In Kitchen',       color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)',icon: ChefHat,       border: '#8B5CF6' },
  out_for_delivery: { label: 'Out for Delivery', color: '#6366F1', bg: 'rgba(99,102,241,0.15)', icon: Truck,        border: '#6366F1' },
  delivered:        { label: 'Delivered',        color: '#10B981', bg: 'rgba(16,185,129,0.15)', icon: CheckCircle,  border: '#10B981' },
  cancelled:        { label: 'Cancelled',        color: '#EF4444', bg: 'rgba(239,68,68,0.15)', icon: XCircle,       border: '#EF4444' },
};

/* Next allowed status transitions for vendor */
const NEXT_STATUSES = {
  pending:   [{ value: 'confirmed', label: '✓ Accept Order' }, { value: 'cancelled', label: '✗ Reject Order' }],
  confirmed: [{ value: 'preparing', label: '👨‍🍳 Start Preparing' }, { value: 'cancelled', label: '✗ Cancel Order' }],
  preparing: [{ value: 'out_for_delivery', label: '🚴 Mark Ready / Send for Delivery' }, { value: 'cancelled', label: '✗ Cancel Order' }],
  out_for_delivery: [],
  delivered: [],
  cancelled: [],
};

const FILTER_TABS = [
  { value: 'all',             label: 'All' },
  { value: 'pending',         label: 'New' },
  { value: 'confirmed',       label: 'Confirmed' },
  { value: 'preparing',       label: 'Preparing' },
  { value: 'out_for_delivery',label: 'Out for Delivery' },
  { value: 'delivered',       label: 'Delivered' },
  { value: 'cancelled',       label: 'Cancelled' },
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

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true); else setRefreshing(true);
      const res = await api.get('/orders/vendor/my-orders');
      if (res.data.success) {
        const fetched = res.data.data;
        // Highlight truly new (pending) orders
        const pendingIds = new Set(fetched.filter(o => o.status === 'pending').map(o => o._id));
        setNewOrderIds(pendingIds);
        setOrders(fetched);
        // Re-sync selected order if open
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
    // Poll every 30s for new orders
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, []);

  /* ── Update status ── */
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

  /* ── Quick Accept ── */
  const handleAccept = async (orderId) => {
    setUpdatingId(orderId);
    try {
      await api.post(`/orders/${orderId}/accept`);
      toast.success('Order accepted!');
      await fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept order');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Open reject modal ── */
  const openRejectModal = (orderId) => {
    setPendingRejectId(orderId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  /* ── Confirm rejection ── */
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

  /* ── Filters ── */
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

  if (loading) {
    return (
      <div className="vendor-loading">
        <Loader2 size={40} className="spin" />
        <p>Loading Orders...</p>
      </div>
    );
  }

  return (
    <div className="vendor-orders-container">
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="reject-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={24} color="#EF4444" />
              <h3>Reject Order?</h3>
            </div>
            <p>Please provide a reason for rejection (optional):</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Item unavailable, Restaurant closing soon..."
              rows={3}
            />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="modal-confirm" onClick={confirmReject}>Reject Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="orders-header">
        <div className="header-left">
          <h1>
            Order Management
            {pendingCount > 0 && (
              <span className="pending-alert">
                <Bell size={16} /> {pendingCount} new
              </span>
            )}
          </h1>
          <p>Manage and update orders for your restaurant</p>
        </div>
        <button
          className="refresh-btn"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {FILTER_TABS.map(tab => {
          const count = tab.value === 'all' ? orders.length : orders.filter(o => o.status === tab.value).length;
          return (
            <button
              key={tab.value}
              className={`filter-tab ${statusFilter === tab.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
              {count > 0 && <span className="tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by order # or customer name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Split layout */}
      <div className="orders-content">
        {/* Order List */}
        <div className="orders-list">
          {filtered.length === 0 ? (
            <div className="empty-orders">
              <Package size={52} strokeWidth={1.2} />
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
                  className={`order-card ${isSelected ? 'selected' : ''} ${isNew ? 'is-new' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  {isNew && <span className="new-tag">NEW</span>}
                  <div className="order-card-top">
                    <div className="order-num-row">
                      <span className="order-num">#{order.orderNumber}</span>
                      <span className="order-time">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className="status-pill"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      <Icon size={12} />
                      {cfg.label}
                    </div>
                  </div>
                  <div className="order-card-mid">
                    <div className="customer-row">
                      <User size={13} />
                      <span>{order.customer?.name || 'Customer'}</span>
                    </div>
                    <div className="order-summary-row">
                      <ShoppingBag size={13} />
                      <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      <span className="dot">•</span>
                      <strong>Rs. {order.total_amount}</strong>
                    </div>
                  </div>
                  {/* Quick action buttons on card */}
                  {order.status === 'pending' && (
                    <div className="quick-actions" onClick={e => e.stopPropagation()}>
                      <button
                        className="qa-accept"
                        onClick={() => handleAccept(order._id)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 size={13} className="spin" /> : <CheckCircle size={13} />}
                        Accept
                      </button>
                      <button
                        className="qa-reject"
                        onClick={() => openRejectModal(order._id)}
                        disabled={isUpdating}
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}
                  <ChevronRight size={16} className="card-arrow" />
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="order-details-panel">
          {selectedOrder ? (
            <div className="details-view fade-in" key={selectedOrder._id}>
              {/* Status bar */}
              <div className="detail-status-bar" style={{ background: STATUS_CONFIG[selectedOrder.status]?.bg }}>
                <div className="dsb-left">
                  <span className="dsb-label">#{selectedOrder.orderNumber}</span>
                  <span
                    className="dsb-status"
                    style={{ color: STATUS_CONFIG[selectedOrder.status]?.color }}
                  >
                    {STATUS_CONFIG[selectedOrder.status]?.label}
                  </span>
                </div>
                <span className="dsb-time">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Customer info */}
              <div className="details-section">
                <h3 className="section-title">
                  <User size={16} /> Customer
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name</label>
                    <span>{selectedOrder.customer?.name || '—'}</span>
                  </div>
                  <div className="info-item">
                    <Phone size={14} />
                    <label>Phone</label>
                    <span>{selectedOrder.customer?.phone || 'Not provided'}</span>
                  </div>
                  <div className="info-item full">
                    <MapPin size={14} />
                    <label>Delivery Address</label>
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

              {/* Payment */}
              <div className="details-section">
                <h3 className="section-title">
                  <CreditCard size={16} /> Payment
                </h3>
                <div className="payment-row">
                  <span className="payment-method">{selectedOrder.paymentMethod?.toUpperCase()}</span>
                </div>
              </div>

              {/* Items */}
              <div className="details-section">
                <h3 className="section-title">
                  <ShoppingBag size={16} /> Order Items
                </h3>
                <div className="items-list">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="detail-item">
                      <div className="item-qty-box">{item.quantity}×</div>
                      <div className="item-name-col">
                        <span className="i-name">{item.name}</span>
                        {item.special_notes && <span className="i-note">Note: {item.special_notes}</span>}
                      </div>
                      <div className="item-subtotal">Rs. {item.subtotal}</div>
                    </div>
                  ))}
                </div>
                <div className="order-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>Rs. {selectedOrder.subtotal}</span>
                  </div>
                  <div className="total-row">
                    <span>Delivery Fee</span>
                    <span>Rs. {selectedOrder.delivery_fee}</span>
                  </div>
                  <div className="total-row grand">
                    <span>Grand Total</span>
                    <span>Rs. {selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              {NEXT_STATUSES[selectedOrder.status]?.length > 0 && (
                <div className="details-section">
                  <h3 className="section-title">
                    <RefreshCw size={16} /> Update Status
                  </h3>
                  <div className="action-btns">
                    {NEXT_STATUSES[selectedOrder.status].map(({ value, label }) => {
                      const isCancel  = value === 'cancelled';
                      const isUpdating = updatingId === selectedOrder._id;
                      return (
                        <button
                          key={value}
                          className={isCancel ? 'btn-action cancel' : 'btn-action primary'}
                          onClick={() => {
                            if (isCancel && (selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed')) {
                              openRejectModal(selectedOrder._id);
                            } else {
                              updateStatus(selectedOrder._id, value);
                            }
                          }}
                          disabled={isUpdating}
                        >
                          {isUpdating
                            ? <Loader2 size={15} className="spin" />
                            : null}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status timeline */}
              {selectedOrder.statusHistory?.length > 0 && (
                <div className="details-section">
                  <h3 className="section-title">
                    <Clock size={16} /> Timeline
                  </h3>
                  <div className="timeline">
                    {selectedOrder.statusHistory.slice().reverse().map((h, i) => {
                      const cfg = STATUS_CONFIG[h.status] || {};
                      return (
                        <div key={i} className="timeline-item">
                          <div className="tl-dot" style={{ background: cfg.color }} />
                          <div className="tl-content">
                            <span className="tl-status" style={{ color: cfg.color }}>{cfg.label || h.status}</span>
                            <span className="tl-note">{h.note}</span>
                            <span className="tl-time">
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
            <div className="no-selection">
              <ShoppingBag size={64} strokeWidth={1.2} />
              <p>Select an order to view details and take action</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorOrders;
