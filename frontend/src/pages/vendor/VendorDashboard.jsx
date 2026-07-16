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
import './vendor-theme.css';
import './Vendordashboard.css';

const statusBadgeClass = (status) => {
  if (status === 'delivered') return 'vp-badge vp-badge--success';
  if (status === 'pending') return 'vp-badge vp-badge--pending';
  if (status === 'cancelled') return 'vp-badge vp-badge--neutral';
  return 'vp-badge vp-badge--wine';
};

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

  if (loading) return <div className="vp-scope vp-loading">Loading dashboard</div>;

  return (
    <div className="vp-scope fade-in">
      <div className="vp-page-header">
        <div>
          <span className="vp-eyebrow">Overview</span>
          <h1>Restaurant Dashboard</h1>
          <p>Manage your restaurant and track performance</p>
          <hr className="vp-rule" />
        </div>
        <button className="vp-btn" onClick={() => window.location.reload()}>Refresh data</button>
      </div>

      <div className="vp-stat-grid">
        <div className="vp-stat-card">
          <div className="vp-stat-icon"><TrendingUp size={20} /></div>
          <div>
            <p className="vp-stat-label">Total revenue</p>
            <p className="vp-stat-value">Rs. {stats.totalRevenue.toLocaleString()}</p>
            <span className="vp-stat-sub">Up 12% from last month</span>
          </div>
        </div>

        <div className="vp-stat-card">
          <div className="vp-stat-icon"><ShoppingBag size={20} /></div>
          <div>
            <p className="vp-stat-label">Total orders</p>
            <p className="vp-stat-value">{stats.totalOrders}</p>
            <span className="vp-stat-sub">{stats.activeOrders} active currently</span>
          </div>
        </div>

        <div className="vp-stat-card">
          <div className="vp-stat-icon"><Utensils size={20} /></div>
          <div>
            <p className="vp-stat-label">Menu items</p>
            <p className="vp-stat-value">{stats.menuItems}</p>
            <span className="vp-stat-sub">Manage your menu</span>
          </div>
        </div>

        <div className="vp-stat-card">
          <div className="vp-stat-icon"><Users size={20} /></div>
          <div>
            <p className="vp-stat-label">Feedback</p>
            <p className="vp-stat-value">4.8</p>
            <span className="vp-stat-sub">92 reviews</span>
          </div>
        </div>
      </div>

      <div className="vd-content-grid">
        <div className="vp-card">
          <div className="vp-card-header vd-header-between">
            <h3>Recent orders</h3>
            <button className="vp-btn--text">View all</button>
          </div>
          <div className="vp-table-wrap">
            <table className="vp-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order._id}>
                    <td className="vp-mono">#{order.orderNumber}</td>
                    <td>
                      <span className="vp-cell-primary">{order.customer?.name}</span>
                      <span className="vp-cell-secondary">{order.customer?.phone}</span>
                    </td>
                    <td>
                      <span className={statusBadgeClass(order.status)}>
                        {order.status === 'pending' && <AlertCircle size={12} />}
                        {order.status === 'delivered' && <CheckCircle size={12} />}
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="vp-mono vp-cell-primary">Rs. {order.total_amount}</td>
                    <td>
                      <button className="vp-btn--icon"><MoreVertical size={16} /></button>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={5} className="vp-cell-secondary">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="vp-card">
          <div className="vp-card-header"><h3>Operational insights</h3></div>
          <div className="vp-card-body vd-insights">
            <div className="vd-insight-item">
              <div className="vp-stat-icon"><Clock size={18} /></div>
              <div>
                <span className="vp-cell-primary">Average prep time</span>
                <span className="vp-cell-secondary">24 minutes (peak: 32m)</span>
              </div>
            </div>
            <div className="vd-insight-item">
              <div className="vp-stat-icon"><CheckCircle size={18} /></div>
              <div>
                <span className="vp-cell-primary">Order completion</span>
                <span className="vp-cell-secondary">98.2% acceptance rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;