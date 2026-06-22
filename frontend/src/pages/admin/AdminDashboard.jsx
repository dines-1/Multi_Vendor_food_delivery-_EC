import React, { useState, useEffect } from 'react';
import {
  DollarSign, ShoppingCart, Store, Users, Package
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const formatNPR = (v) => `NPR ${Number(v || 0).toLocaleString()}`;
const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

const statusBadge = (s) => {
  const map = {
    pending: 'badge-warning', confirmed: 'badge-info', preparing: 'badge-purple',
    out_for_delivery: 'badge-info', delivered: 'badge-success', cancelled: 'badge-danger',
  };
  return `badge ${map[s] || 'badge-default'}`;
};

const AdminDashboard = () => {
  const [kpi, setKpi] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [k, r, o, s, ro, pv] = await Promise.all([
        adminService.getKPI(),
        adminService.getRevenueChart(),
        adminService.getOrdersChart(),
        adminService.getOrderStatus(),
        adminService.getRecentOrders(),
        adminService.getPendingVendors(),
      ]);
      setKpi(k.data);
      setRevenueData(r.data?.map(d => ({ date: d._id?.slice(5), revenue: d.revenue })) || []);
      setOrdersData(o.data?.map(d => ({ date: d._id?.slice(5), orders: d.count })) || []);
      setStatusData(s.data?.map(d => ({ name: d._id, value: d.count })) || []);
      setRecentOrders(ro.data || []);
      setPendingVendors(pv.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorAction = async (id, action) => {
    try {
      if (action === 'approve') await adminService.approveVendor(id);
      else await adminService.rejectVendor(id);
      toast.success(`Vendor ${action}d`);
      setPendingVendors(prev => prev.filter(v => v._id !== id));
    } catch { toast.error('Action failed'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const kpiCards = [
    { label: 'Total Revenue', value: formatNPR(kpi?.totalRevenue), icon: DollarSign, bg: '#EDE9FE', color: '#6366F1' },
    { label: 'Total Orders', value: kpi?.totalOrders || 0, icon: ShoppingCart, bg: '#DBEAFE', color: '#3B82F6' },
    { label: 'Active Vendors', value: kpi?.activeVendors || 0, icon: Store, bg: '#D1FAE5', color: '#10B981' },
    { label: 'Total Users', value: kpi?.totalUsers || 0, icon: Users, bg: '#FEF3C7', color: '#F59E0B' },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="stats-grid">
        {kpiCards.map((c, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: c.bg, color: c.color }}>
              <c.icon />
            </div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="chart-row">
        <div className="admin-card">
          <div className="admin-card-header"><h3>Revenue — Last 30 Days</h3></div>
          <div className="admin-card-body">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <Tooltip formatter={(v) => formatNPR(v)} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><Package /><p>No revenue data yet</p></div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><h3>Order Status</h3></div>
          <div className="admin-card-body">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><Package /><p>No order data yet</p></div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="admin-card-header"><h3>Orders — Last 7 Days</h3></div>
        <div className="admin-card-body">
          {ordersData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ordersData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="orders" fill="#6366F1" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><Package /><p>No orders yet</p></div>
          )}
        </div>
      </div>

      <div className="chart-row">
        <div className="admin-table-container" style={{ marginBottom: 0 }}>
          <div className="table-toolbar"><h3>Recent Orders</h3></div>
          {recentOrders.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{o.orderNumber || '-'}</td>
                    <td>{o.customer?.name || '-'}</td>
                    <td>{o.restaurant?.name || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{formatNPR(o.total_amount)}</td>
                    <td><span className={statusBadge(o.status)}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state"><ShoppingCart /><p>No orders yet</p></div>
          )}
        </div>

        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-header"><h3>Pending Approvals</h3></div>
          {pendingVendors.length > 0 ? (
            <div className="widget-list">
              {pendingVendors.map(v => (
                <div key={v._id} className="widget-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EDE9FE', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                      {v.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#0F172A' }}>{v.name}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{v.owner?.email}</div>
                    </div>
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-success btn-sm" onClick={() => handleVendorAction(v._id, 'approve')}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleVendorAction(v._id, 'reject')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><Store /><p>No pending approvals</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;