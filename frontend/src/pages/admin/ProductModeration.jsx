import React, { useState, useEffect } from 'react';
import { Package, Star, CheckCircle, XCircle, Trash2, Plus, X, FolderTree } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const formatNPR = (v) => `NPR ${Number(v || 0).toLocaleString()}`;

const ProductModeration = () => {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', image: '', parentCategory: '' });

  useEffect(() => {
    if (tab === 'products') loadProducts();
    else loadCategories();
  }, [tab, page, statusFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await adminService.getProducts({ page, approvalStatus: statusFilter, limit: 10 });
      setProducts(res.data || []);
      setPagination(res.pagination || {});
    } catch { toast.error('Failed to load products'); }
    setLoading(false);
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const cats = await adminService.getCategories();
      // Filter categories into global (no parent) and subcategories (has parent)
      const all = cats.data || [];
      setCategories(all.filter(c => !c.parentCategory));
      setSubcategories(all.filter(c => c.parentCategory));
    } catch { toast.error('Failed to load categories'); }
    setLoading(false);
  };

  const handleProductAction = async (id, action) => {
    try {
      if (action === 'approve') await adminService.approveProduct(id);
      else if (action === 'reject') await adminService.rejectProduct(id);
      else if (action === 'featured') await adminService.toggleFeatured(id);
      else if (action === 'remove') await adminService.removeProduct(id, 'Removed by admin');
      toast.success(`Product ${action}d`);
      loadProducts();
    } catch { toast.error('Action failed'); }
  };

  const handleSaveCategory = async () => {
    try {
      if (modal?.editId) await adminService.updateCategory(modal.editId, form);
      else {
        if (modal.type === 'subcategory') {
          await adminService.createSubcategory(form);
        } else {
          await adminService.createCategory(form);
        }
      }
      toast.success(modal?.editId ? 'Updated' : 'Created');
      setModal(null); setForm({ name: '', image: '', parentCategory: '' }); loadCategories();
    } catch { toast.error('Failed to save'); }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await adminService.deleteCategory(id); toast.success('Deleted'); loadCategories(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Product Moderation</h1>

      <div className="tabs">
        <button className={`tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Products</button>
        <button className={`tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>Categories & Subcategories</button>
      </div>

      {tab === 'products' && (
        <div className="admin-table-container">
          <div className="table-toolbar">
            <h3>All Products</h3>
            <div className="table-filters">
              <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? <div className="loading-spinner"><div className="spinner" /></div> :
           products.length === 0 ? <div className="empty-state"><Package /><p>No products found</p></div> : (
            <>
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Vendor</th><th>Price</th><th>Status</th><th>Featured</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.restaurant?.name || '-'}</td>
                      <td>{formatNPR(p.price)}</td>
                      <td><span className={`badge ${p.approvalStatus === 'approved' ? 'badge-success' : p.approvalStatus === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{p.approvalStatus}</span></td>
                      <td>{p.isFeatured ? <Star size={14} style={{ color: '#f59e0b', fill: '#f59e0b' }} /> : '-'}</td>
                      <td>
                        <div className="btn-group">
                          {p.approvalStatus === 'pending' && <>
                            <button className="btn btn-success btn-sm" onClick={() => handleProductAction(p._id, 'approve')}><CheckCircle size={12} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleProductAction(p._id, 'reject')}><XCircle size={12} /></button>
                          </>}
                          <button className="btn btn-outline btn-sm" onClick={() => handleProductAction(p._id, 'featured')}><Star size={12} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleProductAction(p._id, 'remove')}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                  <span style={{ fontSize: '0.75rem' }}>{page} / {pagination.pages}</span>
                  <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Global Categories</h3>
              <button className="btn btn-primary btn-sm" onClick={() => { setForm({ name: '', image: '', parentCategory: '' }); setModal({ type: 'category' }); }}><Plus size={12} /> Add</button>
            </div>
            {loading ? <div className="loading-spinner"><div className="spinner" /></div> :
             categories.length === 0 ? <div className="empty-state"><FolderTree /><p>No categories</p></div> : (
              <div className="widget-list">
                {categories.map(c => (
                  <div key={c._id} className="widget-item">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>/{c.slug}</div>
                    </div>
                    <div className="btn-group">
                      <button className="btn btn-outline btn-sm" onClick={() => { setForm({ name: c.name, image: c.image, parentCategory: '' }); setModal({ type: 'category', editId: c._id }); }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(c._id)}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Subcategories</h3>
              <button className="btn btn-primary btn-sm" onClick={() => { setForm({ name: '', image: '', parentCategory: categories[0]?._id || '' }); setModal({ type: 'subcategory' }); }}><Plus size={12} /> Add</button>
            </div>
            {subcategories.length === 0 ? <div className="empty-state"><FolderTree /><p>No subcategories</p></div> : (
              <div className="widget-list">
                {subcategories.map(s => (
                  <div key={s._id} className="widget-item">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{s.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Parent: {s.parentCategory?.name || 'Unknown'}</div>
                    </div>
                    <div className="btn-group">
                      <button className="btn btn-outline btn-sm" onClick={() => { setForm({ name: s.name, image: s.image, parentCategory: s.parentCategory?._id || s.parentCategory }); setModal({ type: 'subcategory', editId: s._id }); }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(s._id)}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {(modal?.type === 'category' || modal?.type === 'subcategory') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal.editId ? 'Edit' : 'Add'} {modal.type}</h3><button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Image URL</label><input className="form-input" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
              {modal.type === 'subcategory' && (
                <div className="form-group">
                  <label className="form-label">Parent Category</label>
                  <select className="form-select" value={form.parentCategory} onChange={e => setForm({ ...form, parentCategory: e.target.value })}>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveCategory}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductModeration;
