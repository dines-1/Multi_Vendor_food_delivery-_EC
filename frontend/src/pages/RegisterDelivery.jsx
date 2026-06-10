import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bike, Eye, EyeOff, Image, Lock, Mail, MapPin, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const RegisterDelivery = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    avatar: '',
    street: '',
    area: '',
    city: '',
    vehicle_type: 'bike',
    license_plate: ''
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/register-delivery', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        avatar: form.avatar,
        address: {
          street: form.street,
          area: form.area,
          city: form.city
        },
        vehicle_type: form.vehicle_type,
        license_plate: form.license_plate
      });

      login(res.data.token);
      toast.success('Delivery partner application submitted!');
      navigate('/delivery');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-card">
        <Link to="/" className="auth-restaurant-link">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div className="auth-header">
          <div className="auth-logo-ring">
            <Bike size={24} />
          </div>
          <h2>Become a Delivery Partner</h2>
          <p>Register your rider account and start managing deliveries.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <User size={18} />
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Bikash Tamang" required />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
              </div>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <div className="input-wrapper">
                <Phone size={18} />
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="98XXXXXXXX" required />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
              <button type="button" className="input-eye-btn" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Profile Image URL</label>
            <div className="input-wrapper">
              <Image size={18} />
              <input
                name="avatar"
                type="url"
                value={form.avatar}
                onChange={handleChange}
                placeholder="https://example.com/your-photo.jpg"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <div className="input-wrapper">
              <MapPin size={18} />
              <input name="street" value={form.street} onChange={handleChange} placeholder="Street address" required />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Area</label>
              <input name="area" value={form.area} onChange={handleChange} placeholder="Thamel" required />
            </div>
            <div className="form-group">
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Kathmandu" required />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Vehicle</label>
              <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange} required>
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="bicycle">Bicycle</option>
              </select>
            </div>
            <div className="form-group">
              <label>License Plate</label>
              <input name="license_plate" value={form.license_plate} onChange={handleChange} placeholder="Ba 99 Pa 9999" />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span className="btn-loader" /> : <>Submit Application <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already registered? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterDelivery;
