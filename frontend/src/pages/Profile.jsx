import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  ShoppingBag,
  Clock,
  Save,
  LogOut,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      area: '',
      city: '',
    },
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    activeOrders: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data.success || res.data.data) {
        const data = res.data.data || res.data;
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: {
            street: data.address?.street || '',
            area: data.address?.area || '',
            city: data.address?.city || '',
          },
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        fetchStats();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const ordersRes = await api.get('/orders/my-orders');
      const orders = ordersRes.data.data || [];
      const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || order.total || 0), 0);
      const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery'].includes(o.status)).length;

      setStats({
        totalOrders: orders.length,
        totalSpent,
        activeOrders,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must not exceed 50 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.phone.trim()) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    // Address validation (optional fields but if filled, must be valid)
    if (formData.address.street && formData.address.street.length > 100) {
      newErrors['address.street'] = 'Street address must not exceed 100 characters';
    }
    if (formData.address.area && formData.address.area.length > 50) {
      newErrors['address.area'] = 'Area must not exceed 50 characters';
    }
    if (formData.address.city && formData.address.city.length > 50) {
      newErrors['address.city'] = 'City must not exceed 50 characters';
    }

    // Password validation
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (formData.newPassword === formData.currentPassword) {
        newErrors.newPassword = 'New password must be different from current password';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
      // Clear error for this field
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear error for this field
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: {
          street: formData.address.street.trim(),
          area: formData.address.area.trim(),
          city: formData.address.city.trim(),
        },
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const res = await api.put('/auth/profile', updateData);

      if (res.data.success || res.data.data) {
        toast.success('Profile updated successfully');
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        fetchProfile();
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error updating profile';
      toast.error(message);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading your profile...</div>;
  }

  return (
    <div className="profile-page">
      {/* ── HEADER ── */}
      <div className="profile-header">
        <div className="header-content">
          <div className="avatar-large">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="header-info">
            <h1>{formData.name}</h1>
            <p>{formData.email}</p>
            <span className="profile-role-pill">{user?.role || 'customer'}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="btn-logout"
          title="Logout"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* ── STATS ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalOrders}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.activeOrders}</span>
            <span className="stat-label">Active Orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Heart size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">Rs. {stats.totalSpent.toLocaleString()}</span>
            <span className="stat-label">Total Spent</span>
          </div>
        </div>
      </div>

      {/* ── FORM ── */}
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-grid">
          {/* ── PERSONAL INFORMATION ── */}
          <div className="form-section">
            <div className="section-header">
              <User size={20} />
              <h2>Personal Information</h2>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <div className="input-wrapper">
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && (
                  <span className="error-message">
                    <AlertCircle size={16} /> {errors.name}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && (
                  <span className="error-message">
                    <AlertCircle size={16} /> {errors.email}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="input-wrapper">
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+977-1-XXXXXXXXX"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && (
                  <span className="error-message">
                    <AlertCircle size={16} /> {errors.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── ADDRESS ── */}
          <div className="form-section">
            <div className="section-header">
              <MapPin size={20} />
              <h2>Address</h2>
            </div>

            <div className="form-group">
              <label htmlFor="street">Street Address</label>
              <div className="input-wrapper">
                <input
                  id="street"
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="123 Food Street"
                  className={errors['address.street'] ? 'error' : ''}
                />
                {errors['address.street'] && (
                  <span className="error-message">
                    <AlertCircle size={16} /> {errors['address.street']}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="area">Area</label>
                <div className="input-wrapper">
                  <input
                    id="area"
                    type="text"
                    name="address.area"
                    value={formData.address.area}
                    onChange={handleChange}
                    placeholder="Thamel"
                    className={errors['address.area'] ? 'error' : ''}
                  />
                  {errors['address.area'] && (
                    <span className="error-message">
                      <AlertCircle size={16} /> {errors['address.area']}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="city">City</label>
                <div className="input-wrapper">
                  <input
                    id="city"
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    placeholder="Kathmandu"
                    className={errors['address.city'] ? 'error' : ''}
                  />
                  {errors['address.city'] && (
                    <span className="error-message">
                      <AlertCircle size={16} /> {errors['address.city']}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── CHANGE PASSWORD ── */}
          <div className="form-section">
            <div className="section-header">
              <Mail size={20} />
              <h2>Security</h2>
            </div>

            <div className="security-note">
              <AlertCircle size={16} />
              <p>Leave password fields empty if you don't want to change your password</p>
            </div>

            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="input-wrapper">
                <div className="password-input">
                  <input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter your current password"
                    className={errors.currentPassword ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <span className="error-message">
                    <AlertCircle size={16} /> {errors.currentPassword}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="input-wrapper">
                  <input
                    id="newPassword"
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Create a new password"
                    className={errors.newPassword ? 'error' : ''}
                  />
                  {errors.newPassword && (
                    <span className="error-message">
                      <AlertCircle size={16} /> {errors.newPassword}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <div className="password-input">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="error-message">
                      <AlertCircle size={16} /> {errors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SAVE BUTTON ── */}
        <div className="form-footer">
          <button type="submit" className="btn-save" disabled={saving}>
            <Save size={20} />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
