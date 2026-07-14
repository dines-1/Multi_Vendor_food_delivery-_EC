import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './RegisterDelivery.css';

const RegisterDelivery = () => {
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
    license_plate: '',
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
          city: form.city,
        },
        vehicle_type: form.vehicle_type,
        license_plate: form.license_plate,
      });

      login(res.data.token);
      toast.success('Driver application submitted.');
      navigate('/delivery');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="driver-signup-page">
      <div className="driver-signup-shell">
        <div className="driver-signup-intro">
          <Link to="/" className="driver-signup-back">Back to home</Link>
          <p className="driver-signup-kicker">Driver partner</p>
          <h1>Create your driver profile</h1>
          <p>
            Add your contact, address, and vehicle details so your delivery
            partner account can be reviewed.
          </p>
        </div>

        <form className="driver-signup-form" onSubmit={handleSubmit}>
          <div className="driver-form-section">
            <h2>Profile details</h2>
            <div className="driver-form-grid two-columns">
              <label>
                Full name
                <input name="name" value={form.name} onChange={handleChange} placeholder="Bikash Tamang" required />
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="98XXXXXXXX" required />
              </label>
            </div>
            <div className="driver-form-grid two-columns">
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
              </label>
              <label>
                Password
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" minLength={8} required />
              </label>
            </div>
            <label>
              Profile image URL
              <input name="avatar" type="url" value={form.avatar} onChange={handleChange} placeholder="https://example.com/photo.jpg" required />
            </label>
          </div>

          <div className="driver-form-section">
            <h2>Address</h2>
            <label>
              Street address
              <input name="street" value={form.street} onChange={handleChange} placeholder="Street address" required />
            </label>
            <div className="driver-form-grid two-columns">
              <label>
                Area
                <input name="area" value={form.area} onChange={handleChange} placeholder="Thamel" required />
              </label>
              <label>
                City
                <input name="city" value={form.city} onChange={handleChange} placeholder="Kathmandu" required />
              </label>
            </div>
          </div>

          <div className="driver-form-section">
            <h2>Vehicle</h2>
            <div className="driver-form-grid two-columns">
              <label>
                Vehicle type
                <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange} required>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="bicycle">Bicycle</option>
                </select>
              </label>
              <label>
                License plate
                <input name="license_plate" value={form.license_plate} onChange={handleChange} placeholder="Ba 99 Pa 9999" />
              </label>
            </div>
          </div>

          <button className="driver-signup-submit" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit driver application'}
          </button>

          <p className="driver-signup-footer">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default RegisterDelivery;
