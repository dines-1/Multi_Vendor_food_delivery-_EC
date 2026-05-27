import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import './VendorRevenue.css';

const VendorRevenue = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const res = await api.get('/orders/vendor/revenue');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="vendor-loading">Calculating Revenue...</div>;

  const chartData = stats?.dailyRevenue.map(day => ({
    name: new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' }),
    amount: day.amount,
    orders: day.count
  })) || [];

  return (
    <div className="vendor-revenue-container">
      <div className="revenue-header">
        <div>
          <h1>Financial Overview</h1>
        </div>
        <div className="header-actions">
          <button className="btn-export">
            <Download size={18} /> Export Report
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <label>Total Earnings</label>
            <h3>Rs. {stats?.totalEarnings.toLocaleString()}</h3>
            <div className="stat-trend positive">

            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-content">
            <label>Total Orders</label>
            <h3>{stats?.totalOrders}</h3>
            <div className="stat-trend positive">

            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card main-chart">
          <div className="chart-header">
            <h3>Revenue History </h3>
            <div className="chart-legend">
              <div className="legend-item"><span className="dot revenue" /> Revenue</div>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5C1A" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#FF5C1A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: '#FF5C1A', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#FF5C1A"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card side-chart">
          <div className="chart-header">
            <h3>Orders Trend</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  dy={10}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="orders" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRevenue;
