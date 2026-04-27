import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Store, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Utensils, 
  Save, 
  Upload,
  Camera,
  LogOut
} from 'lucide-react';
import './VendorProfile.css';

const VendorProfile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    restaurantName: '',
    description: '',
    address: { street: '', area: '', city: '' },
    cuisines: '',
    openTime: '',
    closeTime: '',
    logo: null
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/restaurants/vendor/my-restaurant');
      if (res.data.success) {
        const data = res.data.data;
        setRestaurant(data);
        setFormData({
          restaurantName: data.name || '',
          description: data.description || '',
          address: {
            street: data.address?.street || '',
            area: data.address?.area || '',
            city: data.address?.city || '',
          },
          cuisines: data.cuisines ? data.cuisines.join(', ') : '',
          openTime: data.openTime || '',
          closeTime: data.closeTime || '',
          logo: null
        });
        if (data.logo_url) {
          setLogoPreview(data.logo_url.startsWith('http') ? data.logo_url : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${data.logo_url}`);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load restaurant profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const data = new FormData();
    data.append('name', formData.restaurantName);
    data.append('description', formData.description);
    data.append('address[street]', formData.address.street);
    data.append('address[area]', formData.address.area);
    data.append('address[city]', formData.address.city);
    data.append('cuisines', formData.cuisines);
    data.append('openTime', formData.openTime);
    data.append('closeTime', formData.closeTime);
    
    if (formData.logo) {
      data.append('logo', formData.logo);
    }

    try {
      const res = await api.post('/restaurants/vendor/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Restaurant profile updated successfully');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="vendor-loading">Loading Profile...</div>;

  return (
    <div className="vendor-profile-container">
      <div className="profile-header">
        <h1>Restaurant Settings</h1>
        <p>Update your business information and storefront details</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-grid">
          {/* Left Column: General Info */}
          <div className="form-column">
            <div className="form-card">
              <div className="card-header">
                <Store size={20} />
                <h3>General Information</h3>
              </div>
              <div className="card-body">
                <div className="input-group">
                  <label>Restaurant Name</label>
                  <input 
                    type="text" 
                    name="restaurantName" 
                    value={formData.restaurantName} 
                    onChange={handleChange}
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange}
                    placeholder="Tell customers about your restaurant"
                    rows="4"
                  />
                </div>
                <div className="input-group">
                  <label>Cuisines (comma separated)</label>
                  <div className="input-with-icon">
                    <Utensils size={18} className="icon" />
                    <input 
                      type="text" 
                      name="cuisines" 
                      value={formData.cuisines} 
                      onChange={handleChange}
                      placeholder="e.g. Italian, Pizza, Pasta"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">
                <MapPin size={20} />
                <h3>Location Details</h3>
              </div>
              <div className="card-body">
                <div className="input-group">
                  <label>Street Address</label>
                  <input 
                    type="text" 
                    name="address.street" 
                    value={formData.address.street} 
                    onChange={handleChange}
                    placeholder="123 Food Street"
                  />
                </div>
                <div className="input-row">
                  <div className="input-group">
                    <label>Area</label>
                    <input 
                      type="text" 
                      name="address.area" 
                      value={formData.address.area} 
                      onChange={handleChange}
                      placeholder="Downtown"
                    />
                  </div>
                  <div className="input-group">
                    <label>City</label>
                    <input 
                      type="text" 
                      name="address.city" 
                      value={formData.address.city} 
                      onChange={handleChange}
                      placeholder="Kathmandu"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visuals & Schedule */}
          <div className="form-column">
            <div className="form-card logo-card">
              <div className="card-header">
                <Camera size={20} />
                <h3>Storefront Visuals</h3>
              </div>
              <div className="card-body logo-upload-section">
                <div className="logo-preview-container">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="logo-preview" />
                  ) : (
                    <div className="logo-placeholder">
                      <Store size={48} />
                    </div>
                  )}
                  <label className="file-upload-label">
                    <Upload size={16} />
                    Change Logo
                    <input type="file" onChange={handleFileChange} accept="image/*" hidden />
                  </label>
                </div>
                <p className="upload-hint">Recommended: Square image, max 2MB</p>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">
                <Clock size={20} />
                <h3>Operating Hours</h3>
              </div>
              <div className="card-body">
                <div className="input-row">
                  <div className="input-group">
                    <label>Opening Time</label>
                    <input 
                      type="time" 
                      name="openTime" 
                      value={formData.openTime} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Closing Time</label>
                    <input 
                      type="time" 
                      name="closeTime" 
                      value={formData.closeTime} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-card admin-info">
              <div className="card-header">
                <ShieldCheck size={20} />
                <h3>Account Information</h3>
              </div>
              <div className="card-body">
                <div className="info-item">
                  <User size={16} />
                  <span>{user?.name} (Owner)</span>
                </div>
                <div className="info-item">
                  <Mail size={16} />
                  <span>{user?.email}</span>
                </div>
                <div className="info-item">
                   <div className={`status-tag ${restaurant?.status}`}>
                      {restaurant?.status?.toUpperCase()}
                   </div>
                </div>
                
                <button type="button" onClick={logout} className="btn-logout-alt">
                   <LogOut size={18} /> Logout Account
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="btn-save" disabled={saving}>
            <Save size={20} />
            {saving ? 'Saving Changes...' : 'Save All Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ShieldCheck = ({ size }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} height={size} 
    viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default VendorProfile;
