import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { Search, UserMinus, UserCheck, Shield } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getCustomers();
      if (data.success) {
        setUsers(data.data.docs);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const data = await adminService.updateUserStatus(id, !currentStatus);
      if (data.success) {
        toast.success(`User ${!currentStatus ? 'activated' : 'suspended'} successfully`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">Manage Customers</div>
        <div className="admin-actions">
          <div className="search-box" style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
            />
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact info</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {user.name.charAt(0)}
                      </div>
                      <div style={{ fontWeight: 600 }}>{user.name}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>{user.email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.phone}</div>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-suspended'}`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleToggleActive(user._id, user.isActive)}
                        className={`action-btn ${user.isActive ? 'btn-suspend' : 'btn-approve'}`}
                      >
                        {user.isActive ? <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><UserMinus size={14} /> Suspend</div> : <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><UserCheck size={14} /> Activate</div>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No customers found</td>
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
