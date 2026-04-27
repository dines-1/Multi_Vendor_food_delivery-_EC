import React, { useState, useEffect } from 'react';
import { Users, Search, Ban, Shield, Download, X, Eye } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};
const formatNPR = (v) => `NPR ${Number(v || 0).toLocaleString()}`;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [newRole, setNewRole] = useState('');

  useEffect(() => { loadUsers(); }, [page, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ page, search, role: roleFilter, limit: 10 });
      setUsers(res.data || []);
      setPagination(res.pagination || {});
    } catch { toast.error('Failed to load users'); }
    setLoading(false);
  };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); loadUsers(); };

  const handleBan = async (id) => {
    try {
      await adminService.banUser(id, banReason);
      toast.success('User banned');
      setModal(null); setBanReason(''); loadUsers();
    } catch { toast.error('Failed'); }
  };

  const handleUnban = async (id) => {
    try {
      await adminService.unbanUser(id);
      toast.success('User unbanned');
      loadUsers();
    } catch { toast.error('Failed'); }
  };

  const handleRoleChange = async (id) => {
    try {
      await adminService.changeRole(id, newRole);
      toast.success('Role updated');
      setModal(null); loadUsers();
    } catch { toast.error('Failed'); }
  };

  const exportCSV = async () => {
    try {
      const res = await adminService.exportUsersCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click();
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
  };

  const viewDetail = async (id) => {
    try {
      const res = await adminService.getUserDetail(id);
      setDetail(res.data);
      setModal({ type: 'detail', id });
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">User Management</h1>

      <div className="admin-table-container">
        <div className="table-toolbar">
          <h3>All Users</h3>
          <div className="table-filters">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="filter-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
              <button type="submit" className="btn btn-primary"><Search size={14} /></button>
            </form>
            <select className="filter-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="delivery">Delivery</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn btn-outline" onClick={exportCSV}><Download size={14} /> CSV</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div className="empty-state"><Users /><p>No users found</p></div>
        ) : (
          <>
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Orders</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-purple' : u.role === 'vendor' ? 'badge-info' : 'badge-default'}`}>{u.role}</span></td>
                    <td>{u.ordersCount || 0}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-outline btn-sm" onClick={() => viewDetail(u._id)}>View</button>
                        {u.isBanned ? (
                          <button className="btn btn-success btn-sm" onClick={() => handleUnban(u._id)}>Unban</button>
                        ) : (
                          <button className="btn btn-danger btn-sm" onClick={() => setModal({ type: 'ban', id: u._id })}>Ban</button>
                        )}
                        <button className="btn btn-outline btn-sm" onClick={() => { setNewRole(u.role); setModal({ type: 'role', id: u._id }); }}>Role</button>
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

      {/* Ban Modal */}
      {modal?.type === 'ban' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Ban User</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Reason</label><textarea className="form-textarea" value={banReason} onChange={e => setBanReason(e.target.value)} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleBan(modal.id)}>Ban User</button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {modal?.type === 'role' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Change Role</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Role</label>
                <select className="form-select" value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                  <option value="delivery">Delivery</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleRoleChange(modal.id)}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modal?.type === 'detail' && detail && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{detail.user?.name}</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div><span className="form-label">Email</span><div style={{ fontSize: '0.85rem' }}>{detail.user?.email}</div></div>
                <div><span className="form-label">Phone</span><div style={{ fontSize: '0.85rem' }}>{detail.user?.phone}</div></div>
                <div><span className="form-label">Role</span><div><span className="badge badge-info">{detail.user?.role}</span></div></div>
                <div><span className="form-label">Status</span><div><span className={`badge ${detail.user?.isBanned ? 'badge-danger' : 'badge-success'}`}>{detail.user?.isBanned ? 'Banned' : 'Active'}</span></div></div>
              </div>
              {detail.orders?.length > 0 && (
                <>
                  <div className="form-label" style={{ marginBottom: '0.5rem' }}>Order History</div>
                  <table className="admin-table" style={{ fontSize: '0.75rem' }}>
                    <thead><tr><th>Order #</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {detail.orders.slice(0, 10).map(o => (
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
