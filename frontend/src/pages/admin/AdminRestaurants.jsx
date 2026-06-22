import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { Search } from 'lucide-react';

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchRestaurants(); }, [filter]);

  const fetchRestaurants = async () => {
    try {
      const data = await adminService.getRestaurants(1, filter);
      if (data.success) setRestaurants(data.data.docs);
    } catch {
      toast.error('Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const data = await adminService.updateRestaurantStatus(id, newStatus);
      if (data.success) {
        toast.success(`Restaurant ${newStatus}`);
        fetchRestaurants();
      }
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">Manage Restaurants</div>
        <div className="admin-actions">
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Search restaurants..." className="form-input" style={{ paddingLeft: 32, width: 220 }} />
          </div>
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((res) => (
                <tr key={res._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F1F5F9', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={res.logo_url || 'https://via.placeholder.com/36'} alt={res.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{res.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.78rem' }}>{res.owner?.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{res.owner?.email}</div>
                  </td>
                  <td>{res.address?.city}, {res.address?.area}</td>
                  <td>
                    <span className={`status-badge status-${res.status}`}>{res.status}</span>
                  </td>
                  <td>
                    <div className="btn-group">
                      {res.status === 'pending' && (
                        <button onClick={() => handleStatusUpdate(res._id, 'active')} className="action-btn btn-approve">Approve</button>
                      )}
                      {res.status === 'active' ? (
                        <button onClick={() => handleStatusUpdate(res._id, 'suspended')} className="action-btn btn-suspend">Suspend</button>
                      ) : (
                        res.status !== 'pending' && (
                          <button onClick={() => handleStatusUpdate(res._id, 'active')} className="action-btn btn-approve">Activate</button>
                        )
                      )}
                      <button className="action-btn btn-view">Details</button>
                    </div>
                  </td>
                </tr>
              ))}
              {restaurants.length === 0 && (
                <tr><td colSpan="5"><div className="empty-state"><p>No restaurants found</p></div></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminRestaurants;