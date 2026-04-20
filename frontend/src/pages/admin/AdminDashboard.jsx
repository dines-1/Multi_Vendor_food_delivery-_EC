import React, { useState, useEffect } from 'react';
import {
  DollarSign, ShoppingCart, Store, Users, Clock, CheckCircle, XCircle, Truck, Package
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];

const formatNPR = (v) => `NPR ${Number(v || 0).toLocaleString()}`;
const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};

const statusBadge = (s) => {
  const map = {
    pending: 'badge-warning', confirmed: 'badge-info', preparing: 'badge-purple',
    out_for_delivery: 'badge-info', delivered: 'badge-success', cancelled: 'badge-danger',
    active: 'badge-success', closed: 'badge-default', suspended: 'badge-danger',
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

  useEffect(() => {
    loadData();
  }, []);

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
    { label: 'Total Revenue', value: formatNPR(kpi?.totalRevenue), icon: DollarSign, bg: '#ede9fe', color: '#6366f1' },
    { label: 'Total Orders', value: kpi?.totalOrders || 0, icon: ShoppingCart, bg: '#dbeafe', color: '#3b82f6' },
    { label: 'Active Vendors', value: kpi?.activeVendors || 0, icon: Store, bg: '#dcfce7', color: '#10b981' },
    { label: 'Total Users', value: kpi?.totalUsers || 0, icon: Users, bg: '#fef3c7', color: '#f59e0b' },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>

      {/* KPI Cards */}
      <div className="stats-grid">
        {kpiCards.map((c, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: c.bg, color: c.color }}>
              <c.icon />
            </div>
            <div className="stat-info">
              <div className="stat-label">{c.label}</div>
              <div className="stat-value">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="chart-row">
        <div className="admin-card">
          <div className="admin-card-header"><h3>Revenue (Last 30 Days)</h3></div>
          <div className="admin-card-body">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatNPR(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
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
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><Package /><p>No order data yet</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Orders Bar Chart */}
      <div className="admin-card" style={{ marginBottom: '1rem' }}>
        <div className="admin-card-header"><h3>Orders (Last 7 Days)</h3></div>
        <div className="admin-card-body">
          {ordersData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><Package /><p>No orders yet</p></div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="chart-row">
        {/* Recent Orders */}
        <div className="admin-table-container">
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
                    <td style={{ fontWeight: 600 }}>{o.orderNumber || '-'}</td>
                    <td>{o.customer?.name || '-'}</td>
                    <td>{o.restaurant?.name || '-'}</td>
                    <td>{formatNPR(o.total_amount)}</td>
                    <td><span className={statusBadge(o.status)}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state"><ShoppingCart /><p>No orders yet</p></div>
          )}
        </div>

        {/* Pending Vendors */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>Pending Approvals</h3></div>
          {pendingVendors.length > 0 ? (
            <div className="widget-list">
              {pendingVendors.map(v => (
                <div key={v._id} className="widget-item">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{v.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{v.owner?.email}</div>
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-success btn-sm" onClick={() => handleVendorAction(v._id, 'approve')}>
                      <CheckCircle size={12} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleVendorAction(v._id, 'reject')}>
                      <XCircle size={12} />
                    </button>
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
