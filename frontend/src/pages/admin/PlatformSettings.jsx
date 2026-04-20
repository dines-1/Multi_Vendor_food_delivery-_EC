import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Truck, Shield } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const PlatformSettings = () => {
  const [tab, setTab] = useState('shipping');
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [modal, setModal] = useState(null);
  
  const [zoneForm, setZoneForm] = useState({ zoneName: '', coverageArea: '', baseDeliveryFee: '' });
  const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', password: '', permissions: ['full-access'] });

  useEffect(() => { loadTab(); }, [tab]);

  const loadTab = async () => {
    setLoading(true);
    try {
      if (tab === 'shipping') {
        const res = await adminService.getShippingZones();
        setZones(res.data || []);
      } else if (tab === 'admins') {
        const res = await adminService.getSubAdmins();
        setAdmins(res.data || []);
      }
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  };

  const handleSaveZone = async () => {
    try {
      if (modal?.editId) await adminService.updateShippingZone(modal.editId, zoneForm);
      else await adminService.createShippingZone(zoneForm);
      toast.success('Saved'); setModal(null); loadTab();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteZone = async (id) => {
    if (!confirm('Delete zone?')) return;
    try { await adminService.deleteShippingZone(id); toast.success('Deleted'); loadTab(); } catch { toast.error('Failed'); }
  };

  const handleSaveAdmin = async () => {
    try {
      if (modal?.editId) await adminService.updateSubAdmin(modal.editId, { permissions: adminForm.permissions });
      else await adminService.createSubAdmin(adminForm);
      toast.success('Saved'); setModal(null); loadTab();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteAdmin = async (id) => {
    if (!confirm('Delete sub-admin?')) return;
    try { await adminService.deleteSubAdmin(id); toast.success('Deleted'); loadTab(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Platform Settings</h1>

      <div className="tabs">
        <button className={`tab ${tab === 'shipping' ? 'active' : ''}`} onClick={() => setTab('shipping')}>Shipping Zones</button>
        <button className={`tab ${tab === 'admins' ? 'active' : ''}`} onClick={() => setTab('admins')}>Sub-Admins</button>
      </div>

      {loading && <div className="loading-spinner"><div className="spinner" /></div>}

      {!loading && tab === 'shipping' && (
        <div className="admin-table-container">
          <div className="table-toolbar">
            <h3>Shipping Zones</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setZoneForm({ zoneName: '', coverageArea: '', baseDeliveryFee: '' }); setModal({ type: 'zone' }); }}><Plus size={12} /> Add Zone</button>
          </div>
          {zones.length === 0 ? <div className="empty-state"><Truck /><p>No shipping zones</p></div> : (
            <table className="admin-table">
              <thead><tr><th>Zone Name</th><th>Coverage</th><th>Base Fee (NPR)</th><th>Actions</th></tr></thead>
              <tbody>
                {zones.map(z => (
                  <tr key={z._id}>
                    <td style={{ fontWeight: 600 }}>{z.zoneName}</td>
                    <td>{z.coverageArea}</td>
                    <td>NPR {z.baseDeliveryFee}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-outline btn-sm" onClick={() => { setZoneForm(z); setModal({ type: 'zone', editId: z._id }); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteZone(z._id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!loading && tab === 'admins' && (
        <div className="admin-table-container">
          <div className="table-toolbar">
            <h3>Sub-Admins</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setAdminForm({ name: '', email: '', phone: '', password: '', permissions: ['full-access'] }); setModal({ type: 'admin' }); }}><Plus size={12} /> Add Admin</button>
          </div>
          {admins.length === 0 ? <div className="empty-state"><Shield /><p>No sub-admins</p></div> : (
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Permissions</th><th>Actions</th></tr></thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td>{a.email}</td>
                    <td>{(a.permissions || []).map(p => <span key={p} className="badge badge-purple" style={{ marginRight: '0.25rem' }}>{p}</span>)}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-outline btn-sm" onClick={() => { setAdminForm({ ...a, password: '' }); setModal({ type: 'admin', editId: a._id }); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAdmin(a._id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Zone Modal */}
      {modal?.type === 'zone' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal.editId ? 'Edit' : 'Add'} Shipping Zone</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Zone Name</label><input className="form-input" value={zoneForm.zoneName} onChange={e => setZoneForm({ ...zoneForm, zoneName: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Coverage Area</label><input className="form-input" value={zoneForm.coverageArea} onChange={e => setZoneForm({ ...zoneForm, coverageArea: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Base Delivery Fee (NPR)</label><input className="form-input" type="number" value={zoneForm.baseDeliveryFee} onChange={e => setZoneForm({ ...zoneForm, baseDeliveryFee: e.target.value })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveZone}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {modal?.type === 'admin' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal.editId ? 'Edit' : 'Add'} Sub-Admin</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              {!modal.editId && <>
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={adminForm.name} onChange={e => setAdminForm({ ...adminForm, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={adminForm.phone} onChange={e => setAdminForm({ ...adminForm, phone: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} /></div>
              </>}
              <div className="form-group">
                <label className="form-label">Permissions</label>
                <select className="form-select" value={adminForm.permissions?.[0] || 'full-access'} onChange={e => setAdminForm({ ...adminForm, permissions: [e.target.value] })}>
                  <option value="full-access">Full Access</option>
                  <option value="finance-only">Finance Only</option>
                  <option value="moderation-only">Moderation Only</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveAdmin}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformSettings;
