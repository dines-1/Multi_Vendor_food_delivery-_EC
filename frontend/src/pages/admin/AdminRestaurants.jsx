import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { Search, Filter, MoreVertical, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, [filter]);

  const fetchRestaurants = async () => {
    try {
      const data = await adminService.getRestaurants(1, filter);
      if (data.success) {
        setRestaurants(data.data.docs);
      }
    } catch (error) {
      toast.error('Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const data = await adminService.updateRestaurantStatus(id, newStatus);
      if (data.success) {
        toast.success(`Restaurant ${newStatus} successfully`);
        fetchRestaurants();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">Manage Restaurants</div>
        <div className="admin-actions" style={{ display: 'flex', gap: '1rem' }}>
          <div className="search-box" style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search restaurants..." 
              style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
            />
          </div>
          <select 
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden' }}>
                        <img src={res.logo_url || 'https://via.placeholder.com/40'} alt={res.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ fontWeight: 600 }}>{res.name}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>{res.owner?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{res.owner?.email}</div>
                  </td>
                  <td>{res.address?.city}, {res.address?.area}</td>
                  <td>
                    <span className={`status-badge status-${res.status}`}>
                      {res.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {res.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(res._id, 'active')}
                          className="action-btn btn-approve"
                          title="Approve"
                        >
                          Approve
                        </button>
                      )}
                      {res.status === 'active' ? (
                        <button 
                          onClick={() => handleStatusUpdate(res._id, 'suspended')}
                          className="action-btn btn-suspend"
                          title="Suspend"
                        >
                          Suspend
                        </button>
                      ) : (
                        res.status !== 'pending' && (
                          <button 
                            onClick={() => handleStatusUpdate(res._id, 'active')}
                            className="action-btn btn-approve"
                            title="Activate"
                          >
                            Activate
                          </button>
                        )
                      )}
                      <button className="action-btn btn-view">Details</button>
                    </div>
                  </td>
                </tr>
              ))}
              {restaurants.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No restaurants found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminRestaurants;
