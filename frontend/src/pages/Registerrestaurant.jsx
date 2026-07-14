import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Registerrestaurant.css';

const CUISINE_OPTIONS = [
  'Nepali',
  'Indian',
  'Chinese',
  'Italian',
  'Fast Food',
  'Bakery',
  'Pizza',
  'Cafe',
];

const RegisterRestaurant = () => {
  const [loading, setLoading] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    restaurantName: '',
    restaurantStreet: '',
    restaurantArea: '',
    restaurantCity: '',
    customCuisines: '',
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleCuisine = (cuisine) => {
    setSelectedCuisines((current) =>
      current.includes(cuisine)
        ? current.filter((item) => item !== cuisine)
        : [...current, cuisine]
    );
  };

  const cuisines = [
    ...selectedCuisines,
    ...form.customCuisines
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/register-vendor', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: 'vendor',
        restaurantName: form.restaurantName,
        restaurantAddress: {
          street: form.restaurantStreet,
          area: form.restaurantArea,
          city: form.restaurantCity,
        },
        cuisines,
      });

      login(res.data.token);
      toast.success('Restaurant application submitted.');
      navigate('/vendor');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="restaurant-signup-page">
      <div className="restaurant-signup-shell">
        <div className="restaurant-signup-intro">
          <Link to="/" className="restaurant-signup-back">Back to home</Link>
          <p className="restaurant-signup-kicker">Restaurant partner</p>
          <h1>Register your restaurant</h1>
          <p>
            Create your vendor account and share the basic details we need to review
            your restaurant profile.
          </p>
        </div>

        <form className="restaurant-signup-form" onSubmit={handleSubmit}>
          <div className="signup-section">
            <h2>Owner details</h2>
            <div className="signup-grid two-columns">
              <label>
                Full name
                <input name="name" value={form.name} onChange={handleChange} placeholder="Bikash Tamang" required />
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="98XXXXXXXX" required />
              </label>
            </div>
            <div className="signup-grid two-columns">
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@restaurant.com" required />
              </label>
              <label>
                Password
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" minLength={8} required />
              </label>
            </div>
          </div>

          <div className="signup-section">
            <h2>Restaurant details</h2>
            <label>
              Restaurant name
              <input name="restaurantName" value={form.restaurantName} onChange={handleChange} placeholder="The Himalayan Kitchen" required />
            </label>
            <label>
              Street address
              <input name="restaurantStreet" value={form.restaurantStreet} onChange={handleChange} placeholder="45 Boudha Road" required />
            </label>
            <div className="signup-grid two-columns">
              <label>
                Area
                <input name="restaurantArea" value={form.restaurantArea} onChange={handleChange} placeholder="Thamel" required />
              </label>
              <label>
                City
                <input name="restaurantCity" value={form.restaurantCity} onChange={handleChange} placeholder="Kathmandu" required />
              </label>
            </div>
          </div>

          <div className="signup-section">
            <h2>Cuisine</h2>
            <div className="cuisine-list">
              {CUISINE_OPTIONS.map((cuisine) => (
                <button
                  key={cuisine}
                  type="button"
                  className={selectedCuisines.includes(cuisine) ? 'selected' : ''}
                  onClick={() => toggleCuisine(cuisine)}
                >
                  {cuisine}
                </button>
              ))}
            </div>
            <label>
              Other cuisines
              <input name="customCuisines" value={form.customCuisines} onChange={handleChange} placeholder="Tibetan, Continental" />
            </label>
          </div>

          <button className="restaurant-signup-submit" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit restaurant application'}
          </button>

          <p className="restaurant-signup-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default RegisterRestaurant;
