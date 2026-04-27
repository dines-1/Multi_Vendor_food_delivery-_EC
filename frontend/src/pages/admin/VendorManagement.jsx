import React, { useState, useEffect } from 'react';
import { Store, Search, CheckCircle, XCircle, Ban, RefreshCw, Percent, Eye, X } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const formatNPR = (v) => `NPR ${Number(v || 0).toLocaleString()}`;
const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};
const statusBadge = (s) => {
  const map = { active: 'badge-success', pending: 'badge-warning', suspended: 'badge-danger', closed: 'badge-default' };
  return `badge ${map[s] || 'badge-default'}`;
};

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [commission, setCommission] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [performance, setPerformance] = useState(null);

  useEffect(() => { loadVendors(); }, [page, statusFilter]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const res = await adminService.getVendors({ page, search, status: statusFilter, limit: 10 });
      setVendors(res.data || []);
      setPagination(res.pagination || {});
    } catch { toast.error('Failed to load vendors'); }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadVendors();
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') await adminService.approveVendor(id);
      else if (action === 'reject') await adminService.rejectVendor(id);
      else if (action === 'suspend') await adminService.suspendVendor(id, suspendReason);
      else if (action === 'reactivate') await adminService.reactivateVendor(id);
      toast.success(`Vendor ${action}d`);
      setModal(null);
      setSuspendReason('');
      loadVendors();
    } catch { toast.error('Action failed'); }
  };

  const handleCommission = async (id) => {
    try {
      await adminService.setCommission(id, parseFloat(commission));
      toast.success('Commission updated');
      setModal(null);
      setCommission('');
    } catch { toast.error('Failed'); }
  };

  const viewDetail = async (id) => {
    try {
      const [res, perf] = await Promise.all([
        adminService.getVendorDetail(id),
        adminService.getPerformance(id),
      ]);
      setDetail(res.data);
      setPerformance(perf.data);
      setModal({ type: 'detail', id });
    } catch { toast.error('Failed to load detail'); }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Vendor Management</h1>

      <div className="admin-table-container">
        <div className="table-toolbar">
          <h3>All Vendors</h3>
          <div className="table-filters">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="filter-input" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} />
              <button type="submit" className="btn btn-primary"><Search size={14} /></button>
            </form>
            <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : vendors.length === 0 ? (
          <div className="empty-state"><Store /><p>No vendors found</p></div>
        ) : (
          <>
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Rating</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v._id}>
                    <td style={{ fontWeight: 600 }}>{v.name}</td>
                    <td>{v.owner?.email || '-'}</td>
                    <td><span className={statusBadge(v.status)}>{v.status}</span></td>
                    <td>{v.rating?.toFixed(1) || '0.0'} ★</td>
                    <td>{formatDate(v.createdAt)}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-outline btn-sm" onClick={() => viewDetail(v._id)}>View</button>
                        {v.status === 'pending' && <>
                          <button className="btn btn-success btn-sm" onClick={() => handleAction(v._id, 'approve')}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleAction(v._id, 'reject')}>Reject</button>
                        </>}
                        {v.status === 'active' && (
                          <button className="btn btn-warning btn-sm" onClick={() => setModal({ type: 'suspend', id: v._id })}>Suspend</button>
                        )}
                        {v.status === 'suspended' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleAction(v._id, 'reactivate')}>Activate</button>
                        )}
                        <button className="btn btn-outline btn-sm" onClick={() => { setCommission(v.commissionRate || ''); setModal({ type: 'commission', id: v._id }); }}>Commission</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.pages > 1 && (
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                {Array.from({ length: pagination.pages }, (_, i) => (
                  <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
                ))}
                <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Suspend Modal */}
      {modal?.type === 'suspend' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Suspend Vendor</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-textarea" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Enter reason..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleAction(modal.id, 'suspend')}>Suspend</button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Modal */}
      {modal?.type === 'commission' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Set Commission Rate</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Commission %</label>
                <input className="form-input" type="number" value={commission} onChange={e => setCommission(e.target.value)} placeholder="e.g. 15" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleCommission(modal.id)}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modal?.type === 'detail' && detail && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{detail.vendor?.name}</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div><span className="form-label">Owner</span><div style={{ fontSize: '0.85rem' }}>{detail.vendor?.owner?.name}</div></div>
                <div><span className="form-label">Email</span><div style={{ fontSize: '0.85rem' }}>{detail.vendor?.owner?.email}</div></div>
                <div><span className="form-label">Phone</span><div style={{ fontSize: '0.85rem' }}>{detail.vendor?.owner?.phone || '-'}</div></div>
                <div><span className="form-label">Status</span><div><span className={statusBadge(detail.vendor?.status)}>{detail.vendor?.status}</span></div></div>
                <div><span className="form-label">Total Orders</span><div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{detail.stats?.orderCount}</div></div>
                <div><span className="form-label">Total Sales</span><div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatNPR(detail.stats?.totalSales)}</div></div>
                <div><span className="form-label">Rating</span><div style={{ fontSize: '0.85rem' }}>{detail.vendor?.rating?.toFixed(1)} ★</div></div>
                <div><span className="form-label">Commission</span><div style={{ fontSize: '0.85rem' }}>{detail.vendor?.commissionRate ?? 'Global'}%</div></div>
              </div>
              {performance && (
                <div className="admin-card" style={{ marginBottom: '1rem' }}>
                  <div className="admin-card-header"><h3>Performance Score</h3></div>
                  <div className="admin-card-body" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: performance.score >= 70 ? '#10b981' : performance.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                      {performance.score}/100
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>Fulfilment: {performance.fulfilmentRate}%</span>
                      <span>Cancel: {performance.cancelRate}%</span>
                    </div>
                  </div>
                </div>
              )}
              {detail.recentOrders?.length > 0 && (
                <>
                  <div className="form-label" style={{ marginBottom: '0.5rem' }}>Recent Orders</div>
                  <table className="admin-table" style={{ fontSize: '0.75rem' }}>
                    <thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {detail.recentOrders.slice(0, 5).map(o => (
                        <tr key={o._id}>
                          <td>{o.orderNumber || '-'}</td>
                          <td>{o.customer?.name || '-'}</td>
                          <td>{formatNPR(o.total_amount)}</td>
                          <td><span className={`badge ${o.status === 'delivered' ? 'badge-success' : 'badge-warning'}`}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
