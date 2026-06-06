import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Phone, Lock, ArrowRight, Store,
  MapPin, Utensils, Eye, EyeOff, CheckCircle,
} from 'lucide-react';
import './Auth.css';
import './RegisterRestaurant.css';

const STEPS = ['Your Account', 'Restaurant Info', 'Review'];

const CUISINE_OPTIONS = [
  'Nepali', 'Indian', 'Chinese', 'Italian', 'Continental',
  'Fast Food', 'BBQ', 'Sushi', 'Desserts', 'Bakery', 'Café', 'Pizza',
];

const RegisterRestaurant = () => {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState([]);

  const [form, setForm] = useState({
    // Account
    name: '', email: '', phone: '', password: '',
    // Restaurant
    restaurantName: '',
    restaurantStreet: '', restaurantArea: '', restaurantCity: '',
    customCuisines: '',
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleCuisine = (c) =>
    setSelectedCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const allCuisines = [
    ...selectedCuisines,
    ...form.customCuisines.split(',').map((c) => c.trim()).filter(Boolean),
  ];

  const nextStep = (e) => {
    e.preventDefault();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
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
        cuisines: allCuisines,
      };
      const res = await api.post('/auth/register-vendor', payload);
      login(res.data.token);
      toast.success('Application submitted! We will review it shortly.');
      navigate('/restaurant');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rr-page">
      {/* Left panel */}
      <div className="rr-panel">
        <div className="rr-panel-content">
          <Link to="/" className="rr-back-home">← Back to home</Link>
          <div className="rr-panel-brand">🍽️</div>
          <h1>Grow your restaurant with us</h1>
          <p>Join Kathmandu's fastest-growing food platform and reach hundreds of thousands of hungry customers every day.</p>

          <ul className="rr-benefits">
            {[
              { icon: '📈', title: 'Increase your revenue', desc: 'Tap into our large and growing customer base' },
              { icon: '🛵', title: 'We handle delivery', desc: 'Our riders bring the food, you focus on cooking' },
              { icon: '📊', title: 'Real-time dashboard', desc: 'Manage orders and menus from one place' },
              { icon: '🤝', title: 'Dedicated support', desc: 'A real team member to help whenever you need' },
            ].map((b) => (
              <li key={b.title}>
                <span className="rr-benefit-icon">{b.icon}</span>
                <div>
                  <strong>{b.title}</strong>
                  <span>{b.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="rr-panel-quote">
            <p>"Since joining, our monthly orders tripled. The platform just works."</p>
            <span>— Bikash T., The Himalayan Kitchen</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="rr-form-side">
        <div className="rr-form-wrap">

          {/* Stepper */}
          <div className="rr-stepper">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className={`rr-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                  <div className="rr-step-dot">
                    {i < step ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`rr-step-line ${i < step ? 'done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* ── STEP 0: Account ── */}
          {step === 0 && (
            <form onSubmit={nextStep} className="auth-form rr-step-form">
              <div className="rr-step-header">
                <h2>Your account details</h2>
                <p>This will be used to log in to your vendor dashboard.</p>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <User size={17} />
                  <input name="name" type="text" placeholder="e.g. Bikash Tamang" value={form.name} onChange={handle} required />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <Mail size={17} />
                    <input name="email" type="email" placeholder="you@restaurant.com" value={form.email} onChange={handle} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-wrapper">
                    <Phone size={17} />
                    <input name="phone" type="tel" placeholder="98XXXXXXXX" value={form.phone} onChange={handle} required />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <Lock size={17} />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={handle}
                    minLength={8}
                    required
                  />
                  <button type="button" className="input-eye-btn" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                Continue <ArrowRight size={17} />
              </button>
            </form>
          )}

          {/* ── STEP 1: Restaurant Info ── */}
          {step === 1 && (
            <form onSubmit={nextStep} className="auth-form rr-step-form">
              <div className="rr-step-header">
                <h2>Tell us about your restaurant</h2>
                <p>We'll show this on your public listing.</p>
              </div>

              <div className="form-group">
                <label>Restaurant Name</label>
                <div className="input-wrapper">
                  <Store size={17} />
                  <input name="restaurantName" type="text" placeholder="e.g. The Himalayan Kitchen" value={form.restaurantName} onChange={handle} required />
                </div>
              </div>

              <div className="form-group">
                <label>Street Address</label>
                <div className="input-wrapper">
                  <MapPin size={17} />
                  <input name="restaurantStreet" type="text" placeholder="e.g. 45 Boudha Road" value={form.restaurantStreet} onChange={handle} required />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Area / Neighbourhood</label>
                  <input name="restaurantArea" type="text" placeholder="e.g. Thamel" value={form.restaurantArea} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input name="restaurantCity" type="text" placeholder="e.g. Kathmandu" value={form.restaurantCity} onChange={handle} required />
                </div>
              </div>

              <div className="form-group">
                <label>Cuisine Types <span className="label-hint">(select all that apply)</span></label>
                <div className="cuisine-chips">
                  {CUISINE_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`cuisine-chip ${selectedCuisines.includes(c) ? 'selected' : ''}`}
                      onClick={() => toggleCuisine(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Other cuisines <span className="label-hint">(comma separated)</span></label>
                <div className="input-wrapper">
                  <Utensils size={17} />
                  <input name="customCuisines" type="text" placeholder="e.g. Tibetan, Fusion" value={form.customCuisines} onChange={handle} />
                </div>
              </div>

              <div className="rr-btn-row">
                <button type="button" className="rr-back-btn" onClick={prevStep}>← Back</button>
                <button type="submit" className="auth-submit-btn">
                  Review Application <ArrowRight size={17} />
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: Review ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="auth-form rr-step-form">
              <div className="rr-step-header">
                <h2>Review your application</h2>
                <p>Make sure everything looks right before submitting.</p>
              </div>

              <div className="rr-review-card">
                <h3>Account</h3>
                <div className="rr-review-row"><span>Name</span><strong>{form.name}</strong></div>
                <div className="rr-review-row"><span>Email</span><strong>{form.email}</strong></div>
                <div className="rr-review-row"><span>Phone</span><strong>{form.phone}</strong></div>
              </div>

              <div className="rr-review-card">
                <h3>Restaurant</h3>
                <div className="rr-review-row"><span>Name</span><strong>{form.restaurantName}</strong></div>
                <div className="rr-review-row">
                  <span>Address</span>
                  <strong>{[form.restaurantStreet, form.restaurantArea, form.restaurantCity].filter(Boolean).join(', ')}</strong>
                </div>
                <div className="rr-review-row">
                  <span>Cuisines</span>
                  <strong>{allCuisines.length > 0 ? allCuisines.join(', ') : '—'}</strong>
                </div>
              </div>

              <div className="rr-note">
                <CheckCircle size={16} />
                <span>Your application will be reviewed by our team. You'll be notified within 24 hours.</span>
              </div>

              <div className="rr-btn-row">
                <button type="button" className="rr-back-btn" onClick={prevStep}>← Back</button>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? <span className="btn-loader" /> : <>Submit Application <ArrowRight size={17} /></>}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer">
            <p>Just a customer? <Link to="/register">Create a regular account</Link></p>
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterRestaurant;