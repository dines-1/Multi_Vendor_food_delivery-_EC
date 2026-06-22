import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { Bike } from 'lucide-react';

const AdminDelivery = () => {
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchDeliveryPartners(); }, [filter]);

  const fetchDeliveryPartners = async () => {
    try {
      const data = await adminService.getDeliveryPersonnel(filter);
      if (data.success) setDeliveryPartners(data.data);
    } catch {
      toast.error('Failed to fetch delivery partners');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const data = await adminService.updateDeliveryStatus(id, newStatus);
      if (data.success) {
        toast.success(`Partner ${newStatus}`);
        fetchDeliveryPartners();
      }
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">Delivery Partners</div>
        <div className="admin-actions">
          <select
            className="filter-select"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending Approval</option>
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
                <th>Partner</th>
                <th>Vehicle</th>
                <th>License Plate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveryPartners.map((partner) => (
                <tr key={partner._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bike size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.78rem' }}>{partner.user?.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{partner.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{partner.vehicle_type}</td>
                  <td>{partner.license_plate || '—'}</td>
                  <td>
                    <span className={`status-badge status-${partner.status}`}>{partner.status}</span>
                  </td>
                  <td>
                    <div className="btn-group">
                      {partner.status === 'pending' && (
                        <button onClick={() => handleStatusUpdate(partner._id, 'active')} className="action-btn btn-approve">Approve</button>
                      )}
                      {partner.status === 'active' ? (
                        <button onClick={() => handleStatusUpdate(partner._id, 'suspended')} className="action-btn btn-suspend">Suspend</button>
                      ) : (
                        partner.status !== 'pending' && (
                          <button onClick={() => handleStatusUpdate(partner._id, 'active')} className="action-btn btn-approve">Activate</button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {deliveryPartners.length === 0 && (
                <tr><td colSpan="5"><div className="empty-state"><p>No delivery partners found</p></div></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDelivery;