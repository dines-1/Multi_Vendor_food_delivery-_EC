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
    image_url: '',
    isVeg: true,
    isAvailable: true
  });

  useEffect(() => {
    fetchMenu();
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      isVeg: true,
      isAvailable: true
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category?._id || '',
      image_url: item.image_url,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/menu/vendor/${editingItem._id}`, formData);
        toast.success('Item updated');
      } else {
        await api.post('/menu/vendor', formData);
        toast.success('Item added');
      }
      setShowModal(false);
      resetForm();
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
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
              <img src={item.image_url || 'https://via.placeholder.com/300x200?text=Food+Image'} alt={item.name} />
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
                  <label>Category ID (Temporary)</label>
                  <input 
                    type="text" 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  />
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
                <label>Image URL</label>
                <input 
                  type="text" 
                  value={formData.image_url} 
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
                />
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
    </div>
  );
};

export default VendorMenu;
