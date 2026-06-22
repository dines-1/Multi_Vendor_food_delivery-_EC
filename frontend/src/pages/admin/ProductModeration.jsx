import React, { useState, useEffect } from 'react';
import { Package, Plus, X, FolderTree, ImageIcon } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const formatNPR = (v) => `NPR ${Number(v || 0).toLocaleString()}`;

const ProductModeration = () => {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', image: null, parentCategory: '' });
  const [imagePreview, setImagePreview] = useState(null);

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
      setCategories((cats.data || []).filter(c => !c.parentCategory));
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveCategory = async () => {
    const data = new FormData();
    data.append('name', form.name);
    if (form.parentCategory) data.append('parentCategory', form.parentCategory);
    if (form.image) data.append('image', form.image);
    try {
      if (modal?.editId) await adminService.updateCategory(modal.editId, data);
      else await adminService.createCategory(data);
      toast.success(modal?.editId ? 'Updated' : 'Created');
      setModal(null); setForm({ name: '', image: null, parentCategory: '' }); setImagePreview(null); loadCategories();
    } catch { toast.error('Failed to save'); }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category? All products in this category will also be deleted.')) return;
    try { await adminService.deleteCategory(id); toast.success('Deleted'); loadCategories(); } catch { toast.error('Failed'); }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${url}`;
  };

  const ImageCell = ({ src, alt }) => {
    const imageUrl = getImageUrl(src);
    return imageUrl ? (
      <img src={imageUrl} alt={alt} style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
    ) : (
      <div style={{ width: 38, height: 38, borderRadius: 8, background: '#F1F5F9', color: '#94A3B8', display: 'grid', placeItems: 'center' }}>
        <ImageIcon size={14} />
      </div>
    );
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Product Moderation</h1>

      <div className="tabs">
        <button className={`tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Products</button>
        <button className={`tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>Categories</button>
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
                  <thead>
                    <tr><th>Image</th><th>Name</th><th>Vendor</th><th>Price</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id}>
                        <td><ImageCell src={p.image_url || p.image} alt={p.name} /></td>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>{p.name}</td>
                        <td>{p.restaurant?.name || '—'}</td>
                        <td>{formatNPR(p.price)}</td>
                        <td>
                          <span className={`badge ${p.approvalStatus === 'approved' ? 'badge-success' : p.approvalStatus === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {p.approvalStatus}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            {p.approvalStatus === 'pending' && <>
                              <button className="btn btn-success btn-sm" onClick={() => handleProductAction(p._id, 'approve')}>Approve</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleProductAction(p._id, 'reject')}>Reject</button>
                            </>}
                            <button className="btn btn-outline btn-sm" onClick={() => handleProductAction(p._id, 'featured')}>
                              {p.isFeatured ? 'Unfeature' : 'Feature'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleProductAction(p._id, 'remove')}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{page} / {pagination.pages}</span>
                    <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
                  </div>
                )}
              </>
            )}
        </div>
      )}

      {tab === 'categories' && (
        <div className="admin-table-container">
          <div className="table-toolbar">
            <h3>All Categories</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setForm({ name: '', image: null, parentCategory: '' }); setImagePreview(null); setModal({ type: 'category' }); }}>
              <Plus size={12} /> Add Category
            </button>
          </div>
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> :
            categories.length === 0 ? <div className="empty-state"><FolderTree /><p>No categories</p></div> : (
              <table className="admin-table">
                <thead>
                  <tr><th>Image</th><th>Name</th><th>Owner</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c._id}>
                      <td><ImageCell src={c.image} alt={c.name} /></td>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>{c.name}</td>
                      <td>{c.restaurant?.name || 'Platform'}</td>
                      <td><span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-outline btn-sm" onClick={() => { setForm({ name: c.name, image: null, parentCategory: '' }); setImagePreview(getImageUrl(c.image)); setModal({ type: 'category', editId: c._id }); }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(c._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      )}

      {modal?.type === 'category' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.editId ? 'Edit' : 'Add'} Category</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Category Image</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {imagePreview && <img src={imagePreview} alt="Preview" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />}
                  <input type="file" onChange={handleFileChange} accept="image/*" />
                </div>
              </div>
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