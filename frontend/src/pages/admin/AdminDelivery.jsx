import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { Search, Bike, ShieldCheck, ShieldAlert } from 'lucide-react';

const AdminDelivery = () => {
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchDeliveryPartners();
  }, [filter]);

  const fetchDeliveryPartners = async () => {
    try {
      const data = await adminService.getDeliveryPersonnel(filter);
      if (data.success) {
        setDeliveryPartners(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch delivery partners');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const data = await adminService.updateDeliveryStatus(id, newStatus);
      if (data.success) {
        toast.success(`Delivery partner ${newStatus} successfully`);
        fetchDeliveryPartners();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">Manage Delivery Partners</div>
        <div className="admin-actions" style={{ display: 'flex', gap: '1rem' }}>
          <select 
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
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
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bike size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{partner.user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{partner.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{partner.vehicle_type}</td>
                  <td>{partner.license_plate || 'N/A'}</td>
                  <td>
                    <span className={`status-badge status-${partner.status}`}>
                      {partner.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {partner.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(partner._id, 'active')}
                          className="action-btn btn-approve"
                        >
                          Approve
                        </button>
                      )}
                      {partner.status === 'active' ? (
                        <button 
                          onClick={() => handleStatusUpdate(partner._id, 'suspended')}
                          className="action-btn btn-suspend"
                        >
                          Suspend
                        </button>
                      ) : (
                        partner.status !== 'pending' && (
                          <button 
                            onClick={() => handleStatusUpdate(partner._id, 'active')}
                            className="action-btn btn-approve"
                          >
                            Activate
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {deliveryPartners.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No delivery partners found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDelivery;
