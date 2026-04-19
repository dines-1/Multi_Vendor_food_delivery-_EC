import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Utensils, 
  ShoppingBag, 
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import adminService from '../../services/adminService';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading statistics...</div>;

  return (
    <div className="admin-dashboard-content">
      <div className="admin-title" style={{ marginBottom: '2rem' }}>Dashboard Overview</div>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="stat-card"
        >
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <Users />
          </div>
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{stats?.users?.customer || 0}</div>
          <div className="stat-trend" style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>
            <TrendingUp size={12} /> +12.5% vs last month
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="stat-card"
        >
          <div className="stat-icon" style={{ backgroundColor: '#fdf2f8', color: '#db2777' }}>
            <Utensils />
          </div>
          <div className="stat-label">Active Restaurants</div>
          <div className="stat-value">{stats?.restaurants?.active || 0}</div>
          <div className="stat-trend" style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.5rem' }}>
            <Clock size={12} /> {stats?.restaurants?.pending || 0} Pending Approvals
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="stat-card"
        >
          <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <ShoppingBag />
          </div>
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats?.orders?.total || 0}</div>
          <div className="stat-trend" style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>
            <TrendingUp size={12} /> +5.2% vs last month
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="stat-card"
        >
          <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>
            <AlertCircle />
          </div>
          <div className="stat-label">Pending Orders</div>
          <div className="stat-value">{stats?.orders?.pending || 0}</div>
          <div className="stat-trend" style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem' }}>
            Requires Attention
          </div>
        </motion.div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="admin-table-container glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Revenue Analytics</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
            {/* Simple CSS Chart */}
            {[45, 60, 45, 75, 55, 90].map((height, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${height}%` }}
                   transition={{ duration: 0.8, delay: i * 0.1 }}
                   style={{ width: '100%', background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '8px 8px 0 0' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Month {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-table-container glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Recent Notifications</h3>
          <div className="notification-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { type: 'restaurant', msg: 'New restaurant registration: "Spice Garden"', time: '2 mins ago' },
              { type: 'delivery', msg: 'Delivery partner "John Doe" updated documents', time: '15 mins ago' },
              { type: 'order', msg: 'High value order alert: $245.00', time: '1 hour ago' },
            ].map((nx, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', borderRadius: '12px', background: '#f8fafc' }}>
                <div style={{ width: '4px', borderRadius: '4px', background: nx.type === 'restaurant' ? '#3b82f6' : nx.type === 'delivery' ? '#10b981' : '#f97316' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{nx.msg}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{nx.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
