import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Percent, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const formatNPR = (v) => `NPR ${Number(v || 0).toLocaleString()}`;
const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};

const FinanceManager = () => {
  const [tab, setTab] = useState('revenue');
  const [revenue, setRevenue] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [globalRate, setGlobalRate] = useState(10);
  const [txnRef, setTxnRef] = useState('');

  useEffect(() => {
    if (tab === 'revenue') loadRevenue();
    else if (tab === 'earnings') loadEarnings();
    else if (tab === 'payouts') loadPayouts();
  }, [tab]);

  const loadRevenue = async () => {
    setLoading(true);
    try {
      const res = await adminService.getRevenue();
      setRevenue(res.data);
      setGlobalRate(res.data?.commissionRate || 10);
    } catch { toast.error('Failed to load revenue'); }
    setLoading(false);
  };

  const loadEarnings = async () => {
    setLoading(true);
    try { const res = await adminService.getVendorEarnings(); setEarnings(res.data || []); } catch { toast.error('Failed to load earnings'); }
    setLoading(false);
  };

  const loadPayouts = async () => {
    setLoading(true);
    try { const res = await adminService.getPayouts(); setPayouts(res.data || []); } catch { toast.error('Failed to load payouts'); }
    setLoading(false);
  };

  const updateGlobalCommission = async () => {
    try { await adminService.updateCommission(globalRate); toast.success('Commission updated'); } catch { toast.error('Failed'); }
  };

  const handlePayout = async (id, status) => {
    try {
      await adminService.processPayout(id, status, txnRef);
      toast.success(`Payout ${status}`);
      setModal(null); setTxnRef(''); loadPayouts();
    } catch { toast.error('Failed'); }
  };

  const exportCSV = async () => {
    try {
      const res = await adminService.exportFinanceCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'finance.csv'; a.click();
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Finance & Payouts</h1>

      <div className="tabs">
        <button className={`tab ${tab === 'revenue' ? 'active' : ''}`} onClick={() => setTab('revenue')}>Revenue</button>
        <button className={`tab ${tab === 'earnings' ? 'active' : ''}`} onClick={() => setTab('earnings')}>Vendor Earnings</button>
        <button className={`tab ${tab === 'payouts' ? 'active' : ''}`} onClick={() => setTab('payouts')}>Payouts</button>
      </div>

      {loading && <div className="loading-spinner"><div className="spinner" /></div>}

      {!loading && tab === 'revenue' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#ede9fe', color: '#6366f1' }}><DollarSign /></div>
              <div className="stat-info"><div className="stat-label">GMV</div><div className="stat-value">{formatNPR(revenue?.totalGMV)}</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#10b981' }}><Percent /></div>
              <div className="stat-info"><div className="stat-label">Commission Earned</div><div className="stat-value">{formatNPR(revenue?.commissionEarned)}</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}><DollarSign /></div>
              <div className="stat-info"><div className="stat-label">Net Revenue</div><div className="stat-value">{formatNPR(revenue?.netRevenue)}</div></div>
            </div>
          </div>

          <div className="chart-row-equal">
            <div className="admin-card">
              <div className="admin-card-header"><h3>Revenue Trend</h3></div>
              <div className="admin-card-body">
                {revenue?.chartData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={revenue.chartData.map(d => ({ date: d._id?.slice(5), gmv: d.gmv }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={v => formatNPR(v)} />
                      <Line type="monotone" dataKey="gmv" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="empty-state"><DollarSign /><p>No data yet</p></div>}
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header"><h3>Commission Settings</h3></div>
              <div className="admin-card-body">
                <div className="form-group">
                  <label className="form-label">Global Commission Rate (%)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="form-input" type="number" value={globalRate} onChange={e => setGlobalRate(e.target.value)} />
                    <button className="btn btn-primary" onClick={updateGlobalCommission}>Save</button>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem' }} onClick={exportCSV}><Download size={14} /> Export Finance CSV</button>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && tab === 'earnings' && (
        <div className="admin-table-container">
          <div className="table-toolbar"><h3>Vendor Earnings Ledger</h3></div>
          {earnings.length === 0 ? <div className="empty-state"><DollarSign /><p>No earnings data</p></div> : (
            <table className="admin-table">
              <thead><tr><th>Vendor</th><th>Gross Sales</th><th>Commission %</th><th>Commission</th><th>Refunds</th><th>Net Payable</th></tr></thead>
              <tbody>
                {earnings.map(e => (
                  <tr key={e.vendorId}>
                    <td style={{ fontWeight: 600 }}>{e.vendorName}</td>
                    <td>{formatNPR(e.grossSales)}</td>
                    <td>{e.commissionRate}%</td>
                    <td style={{ color: '#ef4444' }}>-{formatNPR(e.commissionDeducted)}</td>
                    <td style={{ color: '#f59e0b' }}>-{formatNPR(e.refunds)}</td>
                    <td style={{ fontWeight: 700 }}>{formatNPR(e.netPayable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!loading && tab === 'payouts' && (
        <div className="admin-table-container">
          <div className="table-toolbar"><h3>Payout Requests</h3></div>
          {payouts.length === 0 ? <div className="empty-state"><DollarSign /><p>No payout requests</p></div> : (
            <table className="admin-table">
              <thead><tr><th>Vendor</th><th>Amount</th><th>Status</th><th>Requested</th><th>Actions</th></tr></thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.restaurantName || '-'}</td>
                    <td>{formatNPR(p.amount)}</td>
                    <td><span className={`badge ${p.status === 'paid' ? 'badge-success' : p.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{p.status}</span></td>
                    <td>{formatDate(p.createdAt)}</td>
                    <td>
                      {p.status === 'pending' && (
                        <div className="btn-group">
                          <button className="btn btn-success btn-sm" onClick={() => setModal({ type: 'payout', id: p._id })}>Pay</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handlePayout(p._id, 'rejected')}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Payout Modal */}
      {modal?.type === 'payout' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Process Payout</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Transaction Reference</label><input className="form-input" value={txnRef} onChange={e => setTxnRef(e.target.value)} placeholder="e.g. TXN-123456" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={() => handlePayout(modal.id, 'paid')}>Mark as Paid</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
