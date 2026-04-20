import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Download, Eye, X, RefreshCw, AlertTriangle } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const formatNPR = (v) => `NPR ${Number(v || 0).toLocaleString()}`;
const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};
const statusBadge = (s) => {
  const map = { pending: 'badge-warning', confirmed: 'badge-info', preparing: 'badge-purple', out_for_delivery: 'badge-info', delivered: 'badge-success', cancelled: 'badge-danger' };
  return `badge ${map[s] || 'badge-default'}`;
};

const OrderManagement = () => {
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    if (tab === 'orders') loadOrders();
    else loadDisputes();
  }, [tab, page, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await adminService.getOrders({ page, status: statusFilter, limit: 10 });
      setOrders(res.data || []);
      setPagination(res.pagination || {});
    } catch { toast.error('Failed to load orders'); }
    setLoading(false);
  };

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDisputes({ page, status: statusFilter, limit: 10 });
      setDisputes(res.data || []);
      setPagination(res.pagination || {});
    } catch { toast.error('Failed to load disputes'); }
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

  const handleResolve = async (id) => {
    try {
      await adminService.resolveDispute(id, resolution);
      toast.success('Dispute resolved');
      setModal(null); setResolution(''); loadDisputes();
    } catch { toast.error('Failed to resolve dispute'); }
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

      <div className="tabs">
        <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => { setTab('orders'); setPage(1); setStatusFilter(''); }}>Orders</button>
        <button className={`tab ${tab === 'disputes' ? 'active' : ''}`} onClick={() => { setTab('disputes'); setPage(1); setStatusFilter(''); }}>Disputes</button>
      </div>

      {tab === 'orders' && (
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
              <button className="btn btn-outline" onClick={exportCSV}><Download size={14} /> CSV</button>
            </div>
          </div>

          {loading ? <div className="loading-spinner"><div className="spinner" /></div> :
           orders.length === 0 ? <div className="empty-state"><ShoppingCart /><p>No orders found</p></div> : (
            <>
              <table className="admin-table">
                <thead><tr><th>Order #</th><th>Customer</th><th>Vendor</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontWeight: 600 }}>{o.orderNumber || '-'}</td>
                      <td>{o.customer?.name || '-'}</td>
                      <td>{o.restaurant?.name || '-'}</td>
                      <td>{formatNPR(o.total_amount)}</td>
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
                  <span style={{ fontSize: '0.75rem' }}>{page} / {pagination.pages}</span>
                  <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'disputes' && (
        <div className="admin-table-container">
          <div className="table-toolbar">
            <h3>Disputes (from Orders)</h3>
            <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> :
           disputes.length === 0 ? <div className="empty-state"><AlertTriangle /><p>No disputes found</p></div> : (
            <table className="admin-table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {disputes.map(o => (
                  <tr key={o._id}>
                    <td>{o.orderNumber || '-'}</td>
                    <td>{o.customer?.name || '-'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.dispute?.reason || 'No reason'}</td>
                    <td><span className={`badge ${o.dispute?.status === 'resolved' ? 'badge-success' : 'badge-danger'}`}>{o.dispute?.status || 'open'}</span></td>
                    <td>
                      {o.dispute?.status !== 'resolved' && (
                        <button className="btn btn-primary btn-sm" onClick={() => { setResolution(''); setModal({ type: 'resolve', id: o._id }); }}>Resolve</button>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={() => viewOrder(o._id)} style={{ marginLeft: '0.25rem' }}><Eye size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {modal?.type === 'order-detail' && detail && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Order {detail.orderNumber}</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div><span className="form-label">Customer</span><div style={{ fontSize: '0.85rem' }}>{detail.customer?.name}</div></div>
                <div><span className="form-label">Vendor</span><div style={{ fontSize: '0.85rem' }}>{detail.restaurant?.name}</div></div>
                <div><span className="form-label">Amount</span><div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatNPR(detail.total_amount)}</div></div>
                <div><span className="form-label">Payment</span><div><span className="badge badge-default">{detail.paymentMethod}</span></div></div>
              </div>

              {detail.dispute?.isDisputed && (
                <div className="admin-card" style={{ background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '1rem' }}>
                  <div className="admin-card-header" style={{ padding: '0.5rem 1rem' }}><h4 style={{ color: '#991b1b', margin: 0 }}>Dispute Information</h4></div>
                  <div className="admin-card-body" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.85rem' }}><strong>Reason:</strong> {detail.dispute.reason}</div>
                    <div style={{ fontSize: '0.85rem' }}><strong>Status:</strong> {detail.dispute.status}</div>
                    {detail.dispute.resolution && <div style={{ fontSize: '0.85rem' }}><strong>Resolution:</strong> {detail.dispute.resolution}</div>}
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              {detail.statusHistory?.length > 0 && (
                <>
                  <div className="form-label" style={{ marginBottom: '0.5rem' }}>Status Timeline</div>
                  <div className="timeline" style={{ marginBottom: '1rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {detail.statusHistory.map((h, i) => (
                      <div key={i} className="timeline-item">
                        <div className="content" style={{ fontWeight: 600, textTransform: 'capitalize' }}>{h.status}</div>
                        <div className="time">{formatDate(h.timestamp)} {h.note && `— ${h.note}`}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Override Status */}
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
              <div className="form-group">
                <label className="form-label">Note</label>
                <input className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for override" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleOverride}><RefreshCw size={14} /> Update Status</button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {modal?.type === 'resolve' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Resolve Dispute</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Resolution</label><textarea className="form-textarea" value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Enter resolution..." /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleResolve(modal.id)}>Resolve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
