import React, { useState, useEffect } from 'react';
import { ShoppingCart, Download, Eye, X, RefreshCw } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const formatNPR = (v) => `NPR ${Number(v || 0).toLocaleString()}`;
const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};
const statusBadge = (s) => {
  const map = { pending: 'badge-warning', confirmed: 'badge-info', preparing: 'badge-purple', out_for_delivery: 'badge-info', delivered: 'badge-success', cancelled: 'badge-danger' };
  return `badge ${map[s] || 'badge-default'}`;
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => { loadOrders(); }, [page, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await adminService.getOrders({ page, status: statusFilter, limit: 10 });
      setOrders(res.data || []);
      setPagination(res.pagination || {});
    } catch { toast.error('Failed to load orders'); }
    setLoading(false);
  };

  const viewOrder = async (id) => {
    try {
      const res = await adminService.getOrderDetail(id);
      setDetail(res.data);
      setNewStatus(res.data?.status || '');
      setModal({ type: 'order-detail', id });
    } catch { toast.error('Failed to load order details'); }
  };

  const handleOverride = async () => {
    try {
      await adminService.overrideOrderStatus(modal.id, newStatus, note);
      toast.success('Status updated');
      setModal(null); setNote(''); loadOrders();
    } catch { toast.error('Failed to update status'); }
  };

  const handleRefund = async (id, action) => {
    try {
      await adminService.handleRefund(id, action);
      toast.success(`Refund ${action}d`);
      loadOrders();
    } catch { toast.error('Failed to process refund'); }
  };

  const exportCSV = async () => {
    try {
      const res = await adminService.exportOrdersCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click();
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Order Management</h1>

      <div className="admin-table-container">
        <div className="table-toolbar">
          <h3>All Orders</h3>
          <div className="table-filters">
            <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn btn-outline btn-sm" onClick={exportCSV}><Download size={13} /> Export CSV</button>
          </div>
        </div>

        {loading ? <div className="loading-spinner"><div className="spinner" /></div> :
          orders.length === 0 ? <div className="empty-state"><ShoppingCart /><p>No orders found</p></div> : (
            <>
              <table className="admin-table">
                <thead>
                  <tr><th>Order #</th><th>Customer</th><th>Vendor</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>{o.orderNumber || '—'}</td>
                      <td>{o.customer?.name || '—'}</td>
                      <td>{o.restaurant?.name || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{formatNPR(o.total_amount)}</td>
                      <td><span className="badge badge-default">{o.paymentMethod}</span></td>
                      <td><span className={statusBadge(o.status)}>{o.status}</span></td>
                      <td>{formatDate(o.ordered_at)}</td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-outline btn-sm" onClick={() => viewOrder(o._id)}><Eye size={12} /></button>
                          {o.refundRequested && o.refundStatus === 'pending' && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => handleRefund(o._id, 'approve')}>✓ Refund</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleRefund(o._id, 'reject')}>✗</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{page} / {pagination.pages}</span>
                  <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              )}
            </>
          )}
      </div>

      {modal?.type === 'order-detail' && detail && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order {detail.orderNumber}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><span className="form-label">Customer</span><div style={{ fontSize: '0.82rem' }}>{detail.customer?.name}</div></div>
                <div><span className="form-label">Vendor</span><div style={{ fontSize: '0.82rem' }}>{detail.restaurant?.name}</div></div>
                <div><span className="form-label">Amount</span><div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{formatNPR(detail.total_amount)}</div></div>
                <div><span className="form-label">Payment</span><div><span className="badge badge-default">{detail.paymentMethod}</span></div></div>
              </div>

              {detail.statusHistory?.length > 0 && (
                <>
                  <div className="form-label" style={{ marginBottom: 8 }}>Status Timeline</div>
                  <div className="timeline" style={{ marginBottom: 16, maxHeight: 140, overflowY: 'auto' }}>
                    {detail.statusHistory.map((h, i) => (
                      <div key={i} className="timeline-item">
                        <div className="content">{h.status}</div>
                        <div className="time">{formatDate(h.timestamp)}{h.note && ` — ${h.note}`}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Override Status</label>
                <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleOverride}><RefreshCw size={13} /> Update Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;