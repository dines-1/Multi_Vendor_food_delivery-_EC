import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical,
  Filter,
  Package,
  Check,
  X
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './VendorDashboard.css';

const VendorMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null,
    isVeg: true,
    isAvailable: true
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Category specific states
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [newCategoryImagePreview, setNewCategoryImagePreview] = useState(null);

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu/vendor/my-menu');
      if (res.data.success) {
        setMenuItems(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/menu/vendor/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch categories');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    const data = new FormData();
    data.append('name', newCategoryName.trim());
    if (newCategoryImage) {
      data.append('image', newCategoryImage);
    }

    try {
      const res = await api.post('/menu/vendor/categories', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Category created successfully');
        // Reload categories
        const updatedCats = await api.get('/menu/vendor/categories');
        if (updatedCats.data.success) {
          setCategories(updatedCats.data.data);
        }
        // Auto-select the newly created category in the food form
        setFormData(prev => ({ ...prev, category: res.data.data._id }));
        // Close category modal and reset fields
        setShowCategoryModal(false);
        setNewCategoryName('');
        setNewCategoryImage(null);
        setNewCategoryImagePreview(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: null,
      isVeg: true,
      isAvailable: true
    });
    setImagePreview(null);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category?._id || '',
      image: null,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable
    });
    if (item.image) {
      setImagePreview(item.image.startsWith('http') ? item.image : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${item.image}`);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/menu/vendor/${id}`);
        toast.success('Item deleted');
        fetchMenu();
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('isVeg', formData.isVeg);
    data.append('isAvailable', formData.isAvailable);
    
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      if (editingItem) {
        await api.put(`/menu/vendor/${editingItem._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Item updated');
      } else {
        await api.post('/menu/vendor', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Item added');
      }
      setShowModal(false);
      resetForm();
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/300x200?text=Food+Image';
    if (url.startsWith('http')) return url;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${url}`;
  };

  if (loading) return <div className="vendor-loading">Loading Menu...</div>;

  return (
    <div className="vendor-dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Manage Menu</h1>
          <p>Add, edit or remove items from your restaurant menu</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={20} /> Add New Item
        </button>
      </div>

      <div className="menu-filters">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search menu items..." />
        </div>
        <div className="filter-actions">
          <button className="btn-filter"><Filter size={18} /> Filters</button>
        </div>
      </div>

      <div className="menu-grid">
        {menuItems.map(item => (
          <div key={item._id} className="menu-item-card">
            <div className="item-image">
              <img src={getImageUrl(item.image)} alt={item.name} />
              <div className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
                {item.isAvailable ? 'Available' : 'Sold Out'}
              </div>
              <div className="type-badge">
                  <div className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}></div>
              </div>
            </div>
            <div className="item-info">
              <div className="item-header">
                <h3>{item.name}</h3>
                <span className="item-price">Rs. {item.price}</span>
              </div>
              <p>{item.description}</p>
              <div className="item-footer">
                <span className="item-cat">{item.category?.name || 'Uncategorized'}</span>
                <div className="item-actions">
                  <button className="btn-edit" onClick={() => handleEdit(item)}><Edit2 size={16} /></button>
                  <button className="btn-delete" onClick={() => handleDelete(item._id)}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {menuItems.length === 0 && (
          <div className="no-items">
            <Package size={64} />
            <p>Your menu is empty. Start adding delicious dishes!</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add New Dish'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Item Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (Rs.)</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ marginBottom: 0 }}>Category</label>
                    <button 
                      type="button" 
                      onClick={() => setShowCategoryModal(true)} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#ef4444', 
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <Plus size={12} /> Add Custom
                    </button>
                  </div>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: '0.9rem',
                      height: '42px'
                    }}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name} {cat.restaurant ? '(Custom)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows="3" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label>Food Image</label>
                <div className="file-input-wrapper">
                  {imagePreview && (
                    <div className="image-preview-sm">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept="image/*"
                  />
                </div>
              </div>
              <div className="form-toggle-row">
                <div className="toggle-group">
                    <label>Vegetarian</label>
                    <input 
                        type="checkbox" 
                        checked={formData.isVeg} 
                        onChange={(e) => setFormData({...formData, isVeg: e.target.checked})} 
                    />
                </div>
                <div className="toggle-group">
                    <label>Available</label>
                    <input 
                        type="checkbox" 
                        checked={formData.isAvailable} 
                        onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})} 
                    />
                </div>
              </div>
              <button type="submit" className="btn-submit">
                {editingItem ? 'Update Information' : 'Add to Menu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Add Custom Category</h2>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                  setNewCategoryImage(null);
                  setNewCategoryImagePreview(null);
                }}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="modal-form">
              <div className="form-group">
                <label>Category Name</label>
                <input 
                  type="text" 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)} 
                  placeholder="e.g. Desserts, Chef Specials"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Category Image (Optional)</label>
                <div className="file-input-wrapper">
                  {newCategoryImagePreview && (
                    <div className="image-preview-sm">
                      <img src={newCategoryImagePreview} alt="Preview" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewCategoryImage(file);
                        setNewCategoryImagePreview(URL.createObjectURL(file));
                      }
                    }} 
                    accept="image/*"
                  />
                </div>
              </div>
              <button type="submit" className="btn-submit">
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMenu;
