import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Users, 
  Utensils, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import api from '../../services/api';
import './VendorDashboard.css';

const VendorDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    menuItems: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, menuRes] = await Promise.all([
          api.get('/orders/vendor/my-orders'),
          api.get('/menu/vendor/my-menu')
        ]);

        if (ordersRes.data.success && menuRes.data.success) {
          const orders = ordersRes.data.data;
          const menu = menuRes.data.data;

          const totalRevenue = orders.reduce((sum, order) => order.status === 'delivered' ? sum + order.total_amount : sum, 0);
          const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;

          setStats({
            totalOrders: orders.length,
            totalRevenue,
            activeOrders,
            menuItems: menu.length
          });
          setRecentOrders(orders.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="vendor-loading">Loading Dashboard...</div>;

  return (
    <div className="vendor-dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Restaurant Dashboard</h1>
          <p>Manage your restaurant and track performance</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={() => window.location.reload()}>Refresh Data</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon revenue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Revenue</h3>
            <p className="stat-value">Rs. {stats.totalRevenue.toLocaleString()}</p>
            <span className="stat-label">+12% from last month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Orders</h3>
            <p className="stat-value">{stats.totalOrders}</p>
            <span className="stat-label">{stats.activeOrders} active currently</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon items">
            <Utensils size={24} />
          </div>
          <div className="stat-info">
            <h3>Menu Items</h3>
            <p className="stat-value">{stats.menuItems}</p>
            <span className="stat-label">Manage your menu</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon customers">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Feedback</h3>
            <p className="stat-value">4.8</p>
            <span className="stat-label">92 reviews</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-orders-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <button className="btn-link">View All</button>
          </div>
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order._id}>
                    <td><span className="order-id">#{order.orderNumber}</span></td>
                    <td>
                      <div className="customer-info">
                        <strong>{order.customer?.name}</strong>
                        <span>{order.customer?.phone}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${order.status}`}>
                        {order.status === 'pending' && <AlertCircle size={14} />}
                        {order.status === 'delivered' && <CheckCircle size={14} />}
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td><strong>Rs. {order.total_amount}</strong></td>
                    <td>
                      <button className="btn-icon">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="operational-insights">
          <h2>Operational Insights</h2>
          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-icon">
                <Clock size={20} />
              </div>
              <div className="insight-text">
                <strong>Average Prep Time</strong>
                <span>24 minutes (Peak: 32m)</span>
              </div>
            </div>
            <div className="insight-item">
                <div className="insight-icon success">
                    <CheckCircle size={20} />
                </div>
                <div className="insight-text">
                    <strong>Order Completion</strong>
                    <span>98.2% acceptance rate</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
