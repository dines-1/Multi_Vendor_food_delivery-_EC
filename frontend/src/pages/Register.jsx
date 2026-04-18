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
    role: 'customer'
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
      const res = await api.post('/auth/register', formData);
      login(res.data.token);
      toast.success('Account created successfully!');
      navigate('/');
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
