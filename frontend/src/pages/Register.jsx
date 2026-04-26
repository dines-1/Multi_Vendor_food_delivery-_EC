import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, ArrowRight, Truck, Store } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    // Vendor specific fields
    restaurantName: '',
    restaurantStreet: '',
    restaurantArea: '',
    restaurantCity: '',
    cuisines: ''
  });

  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let endpoint = '/auth/register';
      let payload = { ...formData };

      if (formData.role === 'vendor') {
        endpoint = '/auth/register-vendor';
        // Format restaurant address
        payload.restaurantAddress = {
          street: formData.restaurantStreet,
          area: formData.restaurantArea,
          city: formData.restaurantCity
        };
        // Format cuisines as array
        payload.cuisines = formData.cuisines.split(',').map(c => c.trim()).filter(c => c !== '');
      }

      const res = await api.post(endpoint, payload);
      login(res.data.token);
      toast.success(formData.role === 'vendor' ? 'Registration submitted! Awaiting approval.' : 'Account created successfully!');
      navigate(formData.role === 'vendor' ? '/vendor' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-container fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join the community and enjoy delicious food</p>
        </div>

        {/* Role Selector */}
        <div className="role-selector">
          <div 
            className={`role-item ${formData.role === 'customer' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, role: 'customer' })}
          >
            <User size={20} />
            <span>Customer</span>
          </div>
          <div 
            className={`role-item ${formData.role === 'vendor' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, role: 'vendor' })}
          >
            <Store size={20} />
            <span>Restaurant</span>
          </div>
          <div 
            className={`role-item ${formData.role === 'delivery' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, role: 'delivery' })}
          >
            <Truck size={20} />
            <span>Delivery</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <User size={18} color="#636E72" />
              <input 
                name="name"
                type="text" 
                placeholder="John Doe" 
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} color="#636E72" />
                <input 
                  name="email"
                  type="email" 
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <div className="input-wrapper">
                <Phone size={18} color="#636E72" />
                <input 
                  name="phone"
                  type="text" 
                  placeholder="98XXXXXXXX" 
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} color="#636E72" />
              <input 
                name="password"
                type="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {formData.role === 'vendor' && (

            <div className="vendor-fields">
              <h3 style={{ margin: '20px 0 10px', fontSize: '1rem', color: '#2D3436' }}>Restaurant Details</h3>
              <div className="form-group">
                <label>Restaurant Name</label>
                <div className="input-wrapper">
                  <Store size={18} color="#636E72" />
                  <input 
                    name="restaurantName"
                    type="text" 
                    placeholder="e.g. Tasty Bites" 
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required={formData.role === 'vendor'}
                  />
                </div>
              </div>
              <div className="form-group-row">
                <div className="form-group">
                  <label>Street</label>
                  <input 
                    name="restaurantStreet"
                    type="text" 
                    placeholder="123 Street" 
                    value={formData.restaurantStreet}
                    onChange={handleChange}
                    required={formData.role === 'vendor'}
                  />
                </div>
                <div className="form-group">
                  <label>Area</label>
                  <input 
                    name="restaurantArea"
                    type="text" 
                    placeholder="Downtown" 
                    value={formData.restaurantArea}
                    onChange={handleChange}
                    required={formData.role === 'vendor'}
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    name="restaurantCity"
                    type="text" 
                    placeholder="City Name" 
                    value={formData.restaurantCity}
                    onChange={handleChange}
                    required={formData.role === 'vendor'}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Cuisines (comma separated)</label>
                <div className="input-wrapper">
                  <input 
                    name="cuisines"
                    type="text" 
                    placeholder="Italian, Pizza, Chinese" 
                    value={formData.cuisines}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}


          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Get Started'} <ArrowRight size={18} />
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
