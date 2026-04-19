import React, { useState, useEffect } from 'react';
import { Bike, Package, DollarSign, Activity, Settings, Power } from 'lucide-react';
import deliveryService from '../../services/deliveryService';
import { toast } from 'react-hot-toast';
import './Delivery.css';

const DeliveryDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await deliveryService.getProfile();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      const newStatus = !profile.isAvailable;
      const data = await deliveryService.updateProfile({ isAvailable: newStatus });
      if (data.success) {
        setProfile({ ...profile, isAvailable: newStatus });
        toast.success(newStatus ? "You're now Online" : "You're now Offline");
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="delivery-dashboard fade-in">
      <div className="dashboard-header">
        <div className="welcome-info">
          <h1>Welcome, {profile.user?.name}</h1>
          <p>Manage your deliveries and check your performance</p>
        </div>
        <div className={`status-pill ${profile.isAvailable ? 'online' : 'offline'}`} onClick={toggleAvailability}>
          <Power size={18} />
          <span>{profile.isAvailable ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">
            <Package size={24} />
          </div>
          <div className="stat-value">24</div>
          <div className="stat-label">Total Deliveries</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <DollarSign size={24} />
          </div>
          <div className="stat-value">Rs. 4,250</div>
          <div className="stat-label">Total Earnings</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Activity size={24} />
          </div>
          <div className="stat-value">4.8</div>
          <div className="stat-label">Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <Bike size={24} />
          </div>
          <div className="stat-value">{profile.vehicle_type}</div>
          <div className="stat-label">Vehicle Type</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="profile-section card">
          <div className="card-header">
            <h3>Vehicle Details</h3>
            <Settings size={18} />
          </div>
          <div className="profile-details">
            <div className="detail-item">
              <label>Vehicle</label>
              <p>{profile.vehicle_type}</p>
            </div>
            <div className="detail-item">
              <label>License Plate</label>
              <p>{profile.license_plate || 'Not set'}</p>
            </div>
            <button className="edit-btn">Edit Details</button>
          </div>
        </div>

        <div className="work-guide card">
          <h3>Quick Tips</h3>
          <ul>
            <li>Keep your app open for live tracking when delivering.</li>
            <li>Always mark orders as "Picked Up" once you leave the restaurant.</li>
            <li>Maintain a high rating to get more delivery requests.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
