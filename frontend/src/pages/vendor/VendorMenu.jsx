import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Package,
  X
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { fallbackFoodImage, resolveMediaUrl } from '../../utils/customerData';
import './vendor-theme.css';
import './Vendormenu.css';

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
    isAvailable: true,
    ingredients: ''
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
        const updatedCats = await api.get('/menu/vendor/categories');
        if (updatedCats.data.success) {
          setCategories(updatedCats.data.data);
        }
        setFormData(prev => ({ ...prev, category: res.data.data._id }));
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
      isAvailable: true,
      ingredients: ''
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
      isAvailable: item.isAvailable,
      ingredients: item.ingredients ? item.ingredients.join(', ') : ''
    });
    const imgField = item.image_url || item.image;
    if (imgField) {
      setImagePreview(resolveMediaUrl(imgField, fallbackFoodImage));
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
    data.append('ingredients', formData.ingredients);

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

  const getImageUrl = (url) => resolveMediaUrl(url, fallbackFoodImage);

  if (loading) return <div className="vp-scope vp-loading">Loading menu</div>;

  return (
    <div className="vp-scope fade-in">
      <div className="vp-page-header">
        <div>
          <span className="vp-eyebrow">Menu</span>
          <h1>Manage Menu</h1>
          <p>Add, edit or remove items from your restaurant menu</p>
          <hr className="vp-rule" />
        </div>
        <button className="vp-btn vp-btn--primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} /> Add new item
        </button>
      </div>

      <div className="vm-filters">
        <div className="vp-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search menu items..." />
        </div>
        <button className="vp-btn"><Filter size={16} /> Filters</button>
      </div>

      <div className="vm-grid">
        {menuItems.map(item => (
          <div key={item._id} className="vp-card vm-item-card">
            <div className="vm-item-image">
              <img src={getImageUrl(item.image_url || item.image)} alt={item.name} />
              <span className={`vp-badge vm-status-badge ${item.isAvailable ? 'vp-badge--success' : 'vp-badge--neutral'}`}>
                {item.isAvailable ? 'Available' : 'Sold out'}
              </span>
              <span className={`vm-veg-dot ${item.isVeg ? 'veg' : 'non-veg'}`} title={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'} />
            </div>
            <div className="vp-card-body vm-item-body">
              <div className="vm-item-header">
                <h3>{item.name}</h3>
                <span className="vp-mono vm-item-price">Rs. {item.price}</span>
              </div>
              <p className="vm-item-desc">{item.description}</p>
              <div className="vm-item-footer">
                <span className="vp-badge vp-badge--wine">{item.category?.name || 'Uncategorized'}</span>
                <div className="vm-item-actions">
                  <button className="vp-btn--icon" onClick={() => handleEdit(item)}><Edit2 size={15} /></button>
                  <button className="vp-btn--icon danger" onClick={() => handleDelete(item._id)}><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {menuItems.length === 0 && (
          <div className="vp-empty">
            <Package size={40} />
            <p>Your menu is empty. Start adding dishes to your menu.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="vp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="vp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vp-modal-header">
              <h2>{editingItem ? 'Edit item' : 'Add new dish'}</h2>
              <button className="vp-btn--icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="vp-modal-body">
              <div className="vp-field">
                <label>Item name</label>
                <input
                  type="text"
                  className="vp-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="vp-field-row">
                <div className="vp-field">
                  <label>Price (Rs.)</label>
                  <input
                    type="number"
                    className="vp-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="vp-field">
                  <div className="vm-category-label-row">
                    <label>Category</label>
                    <button
                      type="button"
                      className="vp-btn--text"
                      onClick={() => setShowCategoryModal(true)}
                    >
                      <Plus size={12} /> Add custom
                    </button>
                  </div>
                  <select
                    className="vp-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name} {cat.restaurant ? '(Custom)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="vp-field">
                <label>Description</label>
                <textarea
                  className="vp-textarea"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                ></textarea>
              </div>
              <div className="vp-field">
                <label>Ingredients (comma separated)</label>
                <input
                  type="text"
                  className="vp-input"
                  placeholder="e.g. Tomato, Mozzarella, Basil, Olive Oil"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                />
              </div>
              <div className="vp-field">
                <label>Food image</label>
                <div className="vm-file-input-wrapper">
                  {imagePreview && (
                    <div className="vm-image-preview-sm">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                  )}
                  <input type="file" onChange={handleFileChange} accept="image/*" />
                </div>
              </div>
              <div className="vp-toggle-row">
                <label className="vp-toggle">
                  <input
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                  />
                  Vegetarian
                </label>
                <label className="vp-toggle">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  />
                  Available
                </label>
              </div>
              <button type="submit" className="vp-btn vp-btn--primary vp-modal-submit">
                {editingItem ? 'Update information' : 'Add to menu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="vp-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="vp-modal vp-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="vp-modal-header">
              <h2>Add custom category</h2>
              <button
                type="button"
                className="vp-btn--icon"
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                  setNewCategoryImage(null);
                  setNewCategoryImagePreview(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="vp-modal-body">
              <div className="vp-field">
                <label>Category name</label>
                <input
                  type="text"
                  className="vp-input"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Desserts, Chef Specials"
                  required
                />
              </div>
              <div className="vp-field">
                <label>Category image (optional)</label>
                <div className="vm-file-input-wrapper">
                  {newCategoryImagePreview && (
                    <div className="vm-image-preview-sm">
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
              <button type="submit" className="vp-btn vp-btn--primary vp-modal-submit">
                Create category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMenu;