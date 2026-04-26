import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Bike, Hash, ShieldCheck, LogOut, Save } from 'lucide-react';
import './DeliveryProfile.css';

const DeliveryProfile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    vehicle_type: 'bike',
    license_plate: '',
    isAvailable: true,
  });

  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
    if (user) {
      setPersonalInfo({
        name: user.name,
        phone: user.phone || '',
      });
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/delivery/profile');
      if (res.data.success) {
        setProfile({
          vehicle_type: res.data.data.vehicle_type,
          license_plate: res.data.data.license_plate || '',
          isAvailable: res.data.data.isAvailable,
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile({
      ...profile,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Combined update for Personal Info and Delivery Profile
      await api.put('/delivery/profile', {
        ...profile,
        ...personalInfo
      });
      
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">Loading Profile...</div>;

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="header-content">
          <h1>My Profile</h1>
          <p>Manage your delivery account and vehicle settings</p>
        </div>
      </header>

      <div className="profile-grid">
        {/* Profile Card */}
        <div className="profile-card info-card">
          <div className="avatar-section">
            <div className="avatar-placeholder">
              {personalInfo.name.charAt(0)}
            </div>
            <h2>{personalInfo.name}</h2>
            <span className="role-badge">Delivery Personnel</span>
          </div>

          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-label">Member Since</span>
              <span className="stat-value">{new Date(user?.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Availability</span>
              <span className={`status-indicator ${profile.isAvailable ? 'available' : 'unavailable'}`}>
                {profile.isAvailable ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="logout-section mobile-only">
             <button onClick={logout} className="logout-btn">
                <LogOut size={20} />
                Logout Account
             </button>
          </div>
        </div>

        {/* Edit Form */}
        <div className="profile-card edit-card">
          <form onSubmit={handleSubmit}>
            <section className="form-section">
              <h3><User size={18} /> Personal Information</h3>
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input 
                    type="text" 
                    name="name" 
                    value={personalInfo.name} 
                    onChange={handlePersonalChange}
                    required
                  />
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-with-icon disabled">
                    <Mail size={18} className="input-icon" />
                    <input type="email" value={user?.email} disabled />
                  </div>
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={18} className="input-icon" />
                    <input 
                      type="text" 
                      name="phone" 
                      value={personalInfo.phone} 
                      onChange={handlePersonalChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3><Bike size={18} /> Delivery Settings</h3>
              <div className="input-row">
                <div className="input-group">
                  <label>Vehicle Type</label>
                  <div className="input-with-icon">
                    <Bike size={18} className="input-icon" />
                    <select name="vehicle_type" value={profile.vehicle_type} onChange={handleProfileChange}>
                      <option value="bike">Motorcycle / Bike</option>
                      <option value="bicycle">Bicycle</option>
                      <option value="scooter">Electric Scooter</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label>License Plate</label>
                  <div className="input-with-icon">
                    <Hash size={18} className="input-icon" />
                    <input 
                      type="text" 
                      name="license_plate" 
                      value={profile.license_plate} 
                      onChange={handleProfileChange}
                      placeholder="Enter plate number"
                    />
                  </div>
                </div>
              </div>

              <div className="availability-toggle">
                <div className="toggle-info">
                  <h4>Available for Deliveries</h4>
                  <p>Turn off if you're taking a break</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    name="isAvailable" 
                    checked={profile.isAvailable} 
                    onChange={handleProfileChange}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </section>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={saving}>
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeliveryProfile;
