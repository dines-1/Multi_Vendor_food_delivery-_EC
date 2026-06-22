import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { Search, UserMinus, UserCheck } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getCustomers();
      if (data.success) setUsers(data.data.docs);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const data = await adminService.updateUserStatus(id, !currentStatus);
      if (data.success) {
        toast.success(`User ${!currentStatus ? 'activated' : 'suspended'}`);
        fetchUsers();
      }
    } catch { toast.error('Failed to update user status'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">Manage Customers</div>
        <div className="admin-actions">
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search customers..."
              className="form-input"
              style={{ paddingLeft: 32, width: 220 }}
            />
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                        {user.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.78rem' }}>{user.email}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{user.phone}</div>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-suspended'}`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(user._id, user.isActive)}
                      className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                    >
                      {user.isActive
                        ? <><UserMinus size={12} /> Suspend</>
                        : <><UserCheck size={12} /> Activate</>
                      }
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state"><p>No customers found</p></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;