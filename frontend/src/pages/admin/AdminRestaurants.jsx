import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { Search, X, Store, Trash2, Edit3, ShieldAlert, CheckCircle, Percent } from 'lucide-react';
import { fallbackRestaurantImage, resolveMediaUrl } from '../../utils/customerData';

const formatNPR = (v) => `Rs. ${Number(v || 0).toLocaleString()}`;
const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Modals
  const [modal, setModal] = useState(null); // { type: 'detail' | 'suspend' | 'commission', id: string }
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [commissionRate, setCommissionRate] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, [filter, page]);

  const fetchRestaurants = async (searchQuery = search) => {
    setLoading(true);
    try {
      const data = await adminService.getRestaurants({ page, status: filter, search: searchQuery, limit: 10 });
      if (data.success) {
        setRestaurants(data.data.docs || []);
        setPagination({
          totalDocs: data.data.totalDocs,
          pages: data.data.totalPages,
          page: data.data.page,
        });
      }
    } catch {
      toast.error('Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRestaurants(search);
  };

  const handleStatusUpdate = async (id, newStatus, reason = '') => {
    try {
      const data = await adminService.updateRestaurantStatus(id, newStatus, reason);
      if (data.success) {
        toast.success(`Restaurant marked as ${newStatus}`);
        setModal(null);
        setSuspendReason('');
        fetchRestaurants();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCommissionUpdate = async (id) => {
    try {
      const data = await adminService.updateRestaurantCommission(id, commissionRate);
      if (data.success) {
        toast.success('Commission rate updated successfully');
        setModal(null);
        setCommissionRate('');
        fetchRestaurants();
      }
    } catch {
      toast.error('Failed to update commission rate');
    }
  };

  const handleDeleteRestaurant = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const data = await adminService.deleteRestaurant(id);
      if (data.success) {
        toast.success('Restaurant deleted successfully');
        fetchRestaurants();
      }
    } catch {
      toast.error('Failed to delete restaurant');
    }
  };

  const openDetailModal = async (id) => {
    try {
      const data = await adminService.getRestaurantDetail(id);
      if (data.success) {
        setSelectedDetail(data.data);
        setModal({ type: 'detail', id });
      }
    } catch {
      toast.error('Failed to load restaurant details');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="admin-page-title" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Restaurant Management</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Approve, suspend, edit commission, and oversee partner kitchens</p>
        </div>

        <div className="admin-actions" style={{ display: 'flex', gap: 12 }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', gap: 6 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search restaurant or location..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 34, width: 240, height: 36, fontSize: '0.82rem' }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ height: 36, px: 12 }}>Search</button>
          </form>

          <select
            className="filter-select"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            style={{ height: 36, fontSize: '0.82rem' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Owner / Contact</th>
                  <th>Cuisines</th>
                  <th>Location</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((res) => (
                  <tr key={res._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F1F5F9', overflow: 'hidden', flexShrink: 0, border: '1px solid #E2E8F0' }}>
                          <img
                            src={resolveMediaUrl(res.logo_url, fallbackRestaurantImage)}
                            alt={res.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>{res.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>★ {res.rating ? res.rating.toFixed(1) : 'New'} &bull; {formatNPR(res.totalSales)} sales</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B' }}>{res.owner?.name || 'Owner N/A'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{res.owner?.email || res.phone || '-'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 160 }}>
                        {(res.cuisines || []).length > 0
                          ? res.cuisines.slice(0, 2).map((c) => (
                              <span key={c} style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontSize: '0.68rem', color: '#475569' }}>
                                {c}
                              </span>
                            ))
                          : <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>General</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                        {[res.address?.area, res.address?.city].filter(Boolean).join(', ') || 'Kathmandu'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2563EB' }}>
                        {res.commissionRate !== null && res.commissionRate !== undefined ? `${res.commissionRate}%` : 'Standard'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${res.status}`} style={{ textTransform: 'capitalize' }}>
                        {res.status}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="action-btn btn-view"
                          onClick={() => openDetailModal(res._id)}
                        >
                          Details
                        </button>

                        {res.status === 'pending' && (
                          <button
                            type="button"
                            className="action-btn btn-approve"
                            onClick={() => handleStatusUpdate(res._id, 'active')}
                          >
                            Approve
                          </button>
                        )}

                        {res.status === 'active' && (
                          <button
                            type="button"
                            className="action-btn btn-suspend"
                            onClick={() => setModal({ type: 'suspend', id: res._id })}
                          >
                            Suspend
                          </button>
                        )}

                        {(res.status === 'suspended' || res.status === 'closed') && (
                          <button
                            type="button"
                            className="action-btn btn-approve"
                            onClick={() => handleStatusUpdate(res._id, 'active')}
                          >
                            Activate
                          </button>
                        )}

                        <button
                          type="button"
                          className="action-btn"
                          style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}
                          onClick={() => {
                            setCommissionRate(res.commissionRate || '');
                            setModal({ type: 'commission', id: res._id });
                          }}
                          title="Set Commission Rate"
                        >
                          %
                        </button>

                        <button
                          type="button"
                          className="action-btn"
                          style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}
                          onClick={() => handleDeleteRestaurant(res._id, res.name)}
                          title="Delete Restaurant"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {restaurants.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
                        <Store size={36} color="#94A3B8" />
                        <p style={{ margin: '8px 0 0', color: '#64748B' }}>No restaurants found matching criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {pagination.pages > 1 && (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: '16px 0' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: page <= 1 ? '#F8FAFC' : '#FFF', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      background: page === i + 1 ? '#2563EB' : '#FFF',
                      color: page === i + 1 ? '#FFF' : '#334155',
                      fontWeight: page === i + 1 ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: page >= pagination.pages ? '#F8FAFC' : '#FFF', cursor: page >= pagination.pages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Suspend Modal */}
      {modal?.type === 'suspend' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#991B1B' }}>Suspend Restaurant</h3>
              <button type="button" className="modal-close" onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '16px 0' }}>
              <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 12px' }}>Specify reason for suspending this kitchen. This will hide their items from customers.</p>
              <textarea
                className="form-textarea"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Non-compliance with hygiene regulations..."
                rows={4}
                style={{ width: '100%', borderRadius: 8, padding: 10, border: '1px solid #CBD5E1' }}
              />
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={() => handleStatusUpdate(modal.id, 'suspended', suspendReason)}>Confirm Suspension</button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Modal */}
      {modal?.type === 'commission' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Set Commission Rate</h3>
              <button type="button" className="modal-close" onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '16px 0' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Commission Percentage (%)</label>
              <input
                type="number"
                className="form-input"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="e.g. 15"
                min="0"
                max="100"
                style={{ width: '100%', height: 38, paddingLeft: 12, borderRadius: 8, border: '1px solid #CBD5E1' }}
              />
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={() => handleCommissionUpdate(modal.id)}>Save Rate</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modal?.type === 'detail' && selectedDetail && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={resolveMediaUrl(selectedDetail.restaurant.logo_url, fallbackRestaurantImage)}
                  alt={selectedDetail.restaurant.name}
                  style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
                />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedDetail.restaurant.name}</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '16px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Owner Name</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>{selectedDetail.restaurant.owner?.name || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Owner Email</span>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>{selectedDetail.restaurant.owner?.email || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Phone</span>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>{selectedDetail.restaurant.phone || selectedDetail.restaurant.owner?.phone || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                  <div>
                    <span className={`status-badge status-${selectedDetail.restaurant.status}`}>{selectedDetail.restaurant.status}</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Address</span>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    {[selectedDetail.restaurant.address?.street, selectedDetail.restaurant.address?.area, selectedDetail.restaurant.address?.city].filter(Boolean).join(', ') || 'N/A'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Cuisines</span>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>{(selectedDetail.restaurant.cuisines || []).join(', ') || 'General'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Menu Items</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563EB' }}>{selectedDetail.stats.itemCount} dishes</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Total Orders / Sales</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16A34A' }}>{selectedDetail.stats.orderCount} orders ({formatNPR(selectedDetail.stats.totalSales)})</div>
                </div>
              </div>

              {selectedDetail.restaurant.suspendReason && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991B1B', display: 'block', marginBottom: 2 }}>Suspension Reason:</span>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#7F1D1D' }}>{selectedDetail.restaurant.suspendReason}</p>
                </div>
              )}

              {selectedDetail.recentOrders && selectedDetail.recentOrders.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8 }}>Recent Orders</span>
                  <table className="admin-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {selectedDetail.recentOrders.map((o) => (
                        <tr key={o._id}>
                          <td>{o._id.substring(o._id.length - 6)}</td>
                          <td>{o.customer?.name || 'Customer'}</td>
                          <td>{formatNPR(o.total_amount || o.totalPrice)}</td>
                          <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurants;
