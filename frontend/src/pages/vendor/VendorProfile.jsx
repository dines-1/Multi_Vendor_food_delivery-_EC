import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { fallbackRestaurantImage, resolveMediaUrl } from '../../utils/customerData';
import {
  Store,
  User,
  Mail,
  MapPin,
  Clock,
  Utensils,
  Save,
  Upload,
  Camera,
  LogOut
} from 'lucide-react';
import './vendor-theme.css';
import './VendorProfile.css';

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
          setLogoPreview(resolveMediaUrl(data.logo_url, fallbackRestaurantImage));
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

  if (loading) return <div className="vp-scope vp-loading">Loading profile</div>;

  return (
    <div className="vp-scope fade-in">
      <div className="vp-page-header">
        <div>
          <span className="vp-eyebrow">Profile</span>
          <h1>Restaurant Settings</h1>
          <p>Update your business information and storefront details</p>
          <hr className="vp-rule" />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="vpf-grid">
          {/* Left column: general info */}
          <div className="vpf-column">
            <div className="vp-card">
              <div className="vp-card-header"><Store size={18} /><h3>General information</h3></div>
              <div className="vp-card-body">
                <div className="vp-field">
                  <label>Restaurant name</label>
                  <input
                    type="text"
                    className="vp-input"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>
                <div className="vp-field">
                  <label>Description</label>
                  <textarea
                    className="vp-textarea"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell customers about your restaurant"
                    rows="4"
                  />
                </div>
                <div className="vp-field">
                  <label>Cuisines (comma separated)</label>
                  <div className="vp-input-icon-wrap">
                    <Utensils size={16} />
                    <input
                      type="text"
                      className="vp-input"
                      name="cuisines"
                      value={formData.cuisines}
                      onChange={handleChange}
                      placeholder="e.g. Italian, Pizza, Pasta"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="vp-card">
              <div className="vp-card-header"><MapPin size={18} /><h3>Location details</h3></div>
              <div className="vp-card-body">
                <div className="vp-field">
                  <label>Street address</label>
                  <input
                    type="text"
                    className="vp-input"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    placeholder="123 Food Street"
                  />
                </div>
                <div className="vp-field-row">
                  <div className="vp-field">
                    <label>Area</label>
                    <input
                      type="text"
                      className="vp-input"
                      name="address.area"
                      value={formData.address.area}
                      onChange={handleChange}
                      placeholder="Downtown"
                    />
                  </div>
                  <div className="vp-field">
                    <label>City</label>
                    <input
                      type="text"
                      className="vp-input"
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

          {/* Right column: visuals & schedule */}
          <div className="vpf-column">
            <div className="vp-card">
              <div className="vp-card-header"><Camera size={18} /><h3>Storefront visuals</h3></div>
              <div className="vp-card-body vpf-logo-section">
                <div className="vpf-logo-preview-wrap">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="vpf-logo-preview" />
                  ) : (
                    <div className="vpf-logo-placeholder"><Store size={36} /></div>
                  )}
                  <label className="vp-btn vpf-upload-label">
                    <Upload size={15} />
                    Change logo
                    <input type="file" onChange={handleFileChange} accept="image/*" hidden />
                  </label>
                </div>
                <p className="vpf-upload-hint">Recommended: square image, max 2MB</p>
              </div>
            </div>

            <div className="vp-card">
              <div className="vp-card-header"><Clock size={18} /><h3>Operating hours</h3></div>
              <div className="vp-card-body">
                <div className="vp-field-row">
                  <div className="vp-field">
                    <label>Opening time</label>
                    <input
                      type="time"
                      className="vp-input"
                      name="openTime"
                      value={formData.openTime}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="vp-field">
                    <label>Closing time</label>
                    <input
                      type="time"
                      className="vp-input"
                      name="closeTime"
                      value={formData.closeTime}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="vp-card">
              <div className="vp-card-header"><ShieldCheck size={18} /><h3>Account information</h3></div>
              <div className="vp-card-body vpf-account-info">
                <div className="vpf-info-item"><User size={15} /><span>{user?.name} (Owner)</span></div>
                <div className="vpf-info-item"><Mail size={15} /><span>{user?.email}</span></div>
                <div className="vpf-info-item">
                  <span className={`vp-badge ${restaurant?.status === 'approved' ? 'vp-badge--success' : 'vp-badge--pending'}`}>
                    {restaurant?.status?.toUpperCase()}
                  </span>
                </div>
                <button type="button" onClick={logout} className="vp-btn vpf-logout-btn">
                  <LogOut size={16} /> Logout account
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="vpf-footer">
          <button type="submit" className="vp-btn vp-btn--primary" disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving changes...' : 'Save all changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorProfile;