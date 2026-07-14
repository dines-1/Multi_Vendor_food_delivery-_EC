import React, { useEffect, useState } from 'react';
import { Download, Search, Store, Truck, Users, X } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const tabs = [
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'restaurants', label: 'Restaurants', icon: Store },
  { key: 'drivers', label: 'Drivers', icon: Truck },
];

const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

const formatNPR = (v) => `NPR ${Number(v || 0).toLocaleString()}`;

const statusBadge = (status) => {
  const map = {
    active: 'badge-success',
    pending: 'badge-warning',
    suspended: 'badge-danger',
    closed: 'badge-default',
  };
  return `badge ${map[status] || 'badge-default'}`;
};

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [commission, setCommission] = useState('');

  useEffect(() => {
    loadTabData();
  }, [activeTab, page, statusFilter]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'restaurants') {
        const res = await adminService.getVendors({ page, search, status: statusFilter, limit: 10 });
        setRestaurants(res.data || []);
        setPagination(res.pagination || {});
      } else {
        const role = activeTab === 'drivers' ? 'delivery' : 'customer';
        const res = await adminService.getUsers({ page, search, role, limit: 10 });
        const list = res.data || [];
        if (activeTab === 'drivers') setDrivers(list);
        else setCustomers(list);
        setPagination(res.pagination || {});
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (key) => {
    setActiveTab(key);
    setPage(1);
    setSearch('');
    setStatusFilter('');
    setModal(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadTabData();
  };

  const handleBan = async (id) => {
    try {
      await adminService.banUser(id, banReason);
      toast.success('User banned');
      setModal(null);
      setBanReason('');
      loadTabData();
    } catch {
      toast.error('Failed to ban user');
    }
  };

  const handleUnban = async (id) => {
    try {
      await adminService.unbanUser(id);
      toast.success('User unbanned');
      loadTabData();
    } catch {
      toast.error('Failed to unban user');
    }
  };

  const handleRestaurantAction = async (id, action) => {
    try {
      if (action === 'approve') await adminService.approveVendor(id);
      if (action === 'reject') await adminService.rejectVendor(id);
      if (action === 'suspend') await adminService.suspendVendor(id, suspendReason);
      if (action === 'reactivate') await adminService.reactivateVendor(id);
      toast.success(`Restaurant ${action}d`);
      setModal(null);
      setSuspendReason('');
      loadTabData();
    } catch {
      toast.error('Action failed');
    }
  };

  const handleCommission = async (id) => {
    try {
      await adminService.setCommission(id, parseFloat(commission));
      toast.success('Commission updated');
      setModal(null);
      setCommission('');
      loadTabData();
    } catch {
      toast.error('Failed to update commission');
    }
  };

  const exportCSV = async () => {
    try {
      const res = await adminService.exportUsersCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}.csv`;
      a.click();
      toast.success('CSV exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const viewUserDetail = async (id) => {
    try {
      const res = await adminService.getUserDetail(id);
      setDetail(res.data);
      setModal({ type: 'userDetail', id });
    } catch {
      toast.error('Failed to load user detail');
    }
  };

  const viewRestaurantDetail = async (id) => {
    try {
      const [res, perf] = await Promise.all([
        adminService.getVendorDetail(id),
        adminService.getPerformance(id),
      ]);
      setDetail({ ...res.data, performance: perf.data });
      setModal({ type: 'restaurantDetail', id });
    } catch {
      toast.error('Failed to load restaurant detail');
    }
  };

  const currentEmptyIcon = activeTab === 'restaurants' ? Store : activeTab === 'drivers' ? Truck : Users;
  const EmptyIcon = currentEmptyIcon;

  const renderPagination = () => pagination.pages > 1 && (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
      {Array.from({ length: pagination.pages }, (_, i) => (
        <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
      ))}
      <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
    </div>
  );

  const renderUserRows = (items, type) => (
    <>
      <table className="admin-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Orders</th><th>Joined</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u._id}>
              <td style={{ fontWeight: 600, color: '#0F172A' }}>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone || '-'}</td>
              <td><span className={`badge ${type === 'drivers' ? 'badge-info' : 'badge-default'}`}>{u.role}</span></td>
              <td>{u.ordersCount || 0}</td>
              <td>{formatDate(u.createdAt)}</td>
              <td>
                <div className="btn-group">
                  <button className="btn btn-outline btn-sm" onClick={() => viewUserDetail(u._id)}>View</button>
                  {u.isBanned ? (
                    <button className="btn btn-success btn-sm" onClick={() => handleUnban(u._id)}>Unban</button>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => setModal({ type: 'ban', id: u._id })}>Ban</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {renderPagination()}
    </>
  );

  const renderRestaurantRows = () => (
    <>
      <table className="admin-table">
        <thead>
          <tr><th>Restaurant</th><th>Owner</th><th>Status</th><th>Rating</th><th>Joined</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {restaurants.map((r) => (
            <tr key={r._id}>
              <td style={{ fontWeight: 600, color: '#0F172A' }}>{r.name}</td>
              <td>
                <div>{r.owner?.name || '-'}</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{r.owner?.email || '-'}</div>
              </td>
              <td><span className={statusBadge(r.status)}>{r.status}</span></td>
              <td>{r.rating?.toFixed(1) || '0.0'}</td>
              <td>{formatDate(r.createdAt)}</td>
              <td>
                <div className="btn-group">
                  <button className="btn btn-outline btn-sm" onClick={() => viewRestaurantDetail(r._id)}>View</button>
                  {r.status === 'pending' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handleRestaurantAction(r._id, 'approve')}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRestaurantAction(r._id, 'reject')}>Reject</button>
                    </>
                  )}
                  {r.status === 'active' && (
                    <button className="btn btn-warning btn-sm" onClick={() => setModal({ type: 'suspendRestaurant', id: r._id })}>Suspend</button>
                  )}
                  {r.status === 'suspended' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleRestaurantAction(r._id, 'reactivate')}>Activate</button>
                  )}
                  <button className="btn btn-outline btn-sm" onClick={() => { setCommission(r.commissionRate || ''); setModal({ type: 'commission', id: r._id }); }}>%</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {renderPagination()}
    </>
  );

  const activeList = activeTab === 'restaurants' ? restaurants : activeTab === 'drivers' ? drivers : customers;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">User Management</h1>

      <div className="tabs">
        {tabs.map((tab) => (
          <button key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => switchTab(tab.key)}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-table-container">
        <div className="table-toolbar">
          <h3>{tabs.find((tab) => tab.key === activeTab)?.label}</h3>
          <div className="table-filters">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
              <input className="filter-input" placeholder={`Search ${activeTab}...`} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
              <button type="submit" className="btn btn-primary btn-sm"><Search size={13} /></button>
            </form>
            {activeTab === 'restaurants' && (
              <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="closed">Closed</option>
              </select>
            )}
            {activeTab !== 'restaurants' && (
              <button className="btn btn-outline btn-sm" onClick={exportCSV}><Download size={13} /> CSV</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : activeList.length === 0 ? (
          <div className="empty-state"><EmptyIcon /><p>No {activeTab} found</p></div>
        ) : activeTab === 'restaurants' ? renderRestaurantRows() : renderUserRows(activeList, activeTab)}
      </div>

      {modal?.type === 'ban' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Ban User</h3><button className="modal-close" onClick={() => setModal(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Reason for ban</label>
                <textarea className="form-textarea" value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Enter reason..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleBan(modal.id)}>Ban User</button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'suspendRestaurant' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Suspend Restaurant</h3><button className="modal-close" onClick={() => setModal(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-textarea" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Enter reason for suspension..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleRestaurantAction(modal.id, 'suspend')}>Suspend</button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'commission' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Set Commission Rate</h3><button className="modal-close" onClick={() => setModal(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Commission %</label>
                <input className="form-input" type="number" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="e.g. 15" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleCommission(modal.id)}>Save Rate</button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'userDetail' && detail && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>{detail.user?.name}</h3><button className="modal-close" onClick={() => setModal(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><span className="form-label">Email</span><div style={{ fontSize: '0.82rem' }}>{detail.user?.email}</div></div>
                <div><span className="form-label">Phone</span><div style={{ fontSize: '0.82rem' }}>{detail.user?.phone || '-'}</div></div>
                <div><span className="form-label">Role</span><div><span className="badge badge-info">{detail.user?.role}</span></div></div>
                <div><span className="form-label">Status</span><div><span className={`badge ${detail.user?.isBanned ? 'badge-danger' : 'badge-success'}`}>{detail.user?.isBanned ? 'Banned' : 'Active'}</span></div></div>
              </div>
              {detail.orders?.length > 0 && (
                <table className="admin-table" style={{ fontSize: '0.72rem' }}>
                  <thead><tr><th>Order #</th><th>Restaurant</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {detail.orders.slice(0, 10).map((o) => (
                      <tr key={o._id}>
                        <td>{o.orderNumber || '-'}</td>
                        <td>{o.restaurant?.name || '-'}</td>
                        <td>{formatNPR(o.total_amount)}</td>
                        <td><span className={`badge ${o.status === 'delivered' ? 'badge-success' : 'badge-warning'}`}>{o.status}</span></td>
                        <td>{formatDate(o.ordered_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'restaurantDetail' && detail && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>{detail.vendor?.name}</h3><button className="modal-close" onClick={() => setModal(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><span className="form-label">Owner</span><div style={{ fontSize: '0.82rem' }}>{detail.vendor?.owner?.name}</div></div>
                <div><span className="form-label">Email</span><div style={{ fontSize: '0.82rem' }}>{detail.vendor?.owner?.email}</div></div>
                <div><span className="form-label">Status</span><div><span className={statusBadge(detail.vendor?.status)}>{detail.vendor?.status}</span></div></div>
                <div><span className="form-label">Total Sales</span><div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{formatNPR(detail.stats?.totalSales)}</div></div>
              </div>
              {detail.performance && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', marginBottom: 8 }}>Performance Score</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: detail.performance.score >= 70 ? '#10B981' : detail.performance.score >= 40 ? '#F59E0B' : '#EF4444' }}>
                    {detail.performance.score}<span style={{ fontSize: '1rem', color: '#94A3B8' }}>/100</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
