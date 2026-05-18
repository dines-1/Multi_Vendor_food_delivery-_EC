import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Star, ChevronRight, Clock, Flame, Utensils, Zap, Truck, ShoppingBag, Navigation, Smile, Shield, Heart, Award, Quote, Package, CheckCircle, ChefHat, PartyPopper, Activity } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import './Home.css';

/* ─── Status config for active orders ───────────────────────────── */
const ORDER_STATUS = {
  pending:          { label: 'Order Placed',    color: '#F59E0B', step: 0 },
  confirmed:        { label: 'Confirmed',        color: '#3B82F6', step: 1 },
  preparing:        { label: 'Preparing',        color: '#8B5CF6', step: 2 },
  out_for_delivery: { label: 'Out for Delivery', color: '#6366F1', step: 3 },
  delivered:        { label: 'Delivered',        color: '#10B981', step: 4 },
};

const PIPELINE_STEPS = [
  { key: 'pending',          label: 'Placed',    icon: Package },
  { key: 'confirmed',        label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing',        label: 'Preparing', icon: ChefHat },
  { key: 'out_for_delivery', label: 'On Way',    icon: Navigation },
  { key: 'delivered',        label: 'Delivered', icon: PartyPopper },
];

/* ─── Single active order card with animated pipeline ─────────── */
const ActiveOrderCard = ({ order }) => {
  const navigate = useNavigate();
  const cfg       = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const currentStep = cfg.step;

  return (
    <div className="ao-card">
      {/* Card top */}
      <div className="ao-card-top">
        <div className="ao-rest-info">
          <img
            src={order.restaurant?.logo_url || 'https://via.placeholder.com/40'}
            alt={order.restaurant?.name}
            className="ao-rest-logo"
          />
          <div>
            <p className="ao-rest-name">{order.restaurant?.name}</p>
            <span className="ao-order-num">#{order.orderNumber}</span>
          </div>
        </div>
        <div className="ao-status-pill" style={{ color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}12` }}>
          <span className="ao-live-dot" style={{ background: cfg.color }} />
          {cfg.label}
        </div>
      </div>

      {/* ── Animated Pipeline ── */}
      <div className="ao-pipeline">
        {PIPELINE_STEPS.map((step, idx) => {
          const stepCfg   = ORDER_STATUS[step.key];
          const completed = currentStep > idx;
          const isCurrent = currentStep === idx;
          const isLast    = idx === PIPELINE_STEPS.length - 1;
          const IconComp  = step.icon;

          return (
            <React.Fragment key={step.key}>
              {/* Step node */}
              <div className="ao-step">
                <div
                  className={`ao-step-dot ${completed ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  style={(completed || isCurrent) ? { borderColor: stepCfg.color, background: completed ? stepCfg.color : 'transparent' } : {}}
                >
                  {completed ? (
                    <CheckCircle size={11} color="#fff" strokeWidth={3} />
                  ) : isCurrent ? (
                    <>
                      <span className="ao-glow-ring" style={{ borderColor: stepCfg.color }} />
                      <IconComp size={10} color={stepCfg.color} />
                    </>
                  ) : (
                    <IconComp size={10} color="#6b7280" />
                  )}
                </div>
                <span className={`ao-step-label ${isCurrent ? 'current-lbl' : ''} ${completed ? 'done-lbl' : ''}`}
                  style={isCurrent ? { color: stepCfg.color } : {}}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="ao-connector">
                  <div
                    className={`ao-connector-fill ${completed ? 'filled' : ''}`}
                    style={completed ? { background: `linear-gradient(90deg, ${stepCfg.color}, ${ORDER_STATUS[PIPELINE_STEPS[idx + 1].key].color})` } : {}}
                  />
                  {/* Travelling dot animation on current connection */}
                  {currentStep === idx && (
                    <div className="ao-travel-dot" style={{ background: stepCfg.color }} />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Card bottom */}
      <div className="ao-card-bottom">
        <div className="ao-items-preview">
          {order.items.slice(0, 3).map((item, i) => (
            <span key={i} className="ao-item-chip">{item.quantity}× {item.name}</span>
          ))}
          {order.items.length > 3 && (
            <span className="ao-item-chip more">+{order.items.length - 3} more</span>
          )}
        </div>
        <div className="ao-card-actions">
          <span className="ao-total">Rs. {order.total_amount}</span>
          <Link to={`/track-order/${order._id}`} className="ao-track-btn">
            Track Live <ChevronRight size={13} />
          </Link>
          <Link to="/orders" className="ao-details-btn">
            My Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ─── Active Orders Section ─────────────────────────────────────── */
const ActiveOrdersSection = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        const all = res.data.data || [];
        const active = all.filter(o =>
          ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)
        );
        setActiveOrders(active);
      } catch {
        // Silently fail — user may not be logged in
      } finally {
        setLoading(false);
      }
    };
    fetchActive();
  }, []);

  if (loading || activeOrders.length === 0) return null;

  return (
    <section className="active-orders-section">
      <div className="ao-section-header">
        <div className="ao-header-left">
          <div className="ao-live-badge">
            <span className="ao-live-indicator" />
            LIVE
          </div>
          <div>
            <h2 className="ao-title">Active Orders</h2>
            <p className="ao-subtitle">
              {activeOrders.length} order{activeOrders.length > 1 ? 's' : ''} in progress
            </p>
          </div>
        </div>
        <Link to="/orders" className="ao-view-all-btn">
          View All <ChevronRight size={15} />
        </Link>
      </div>

      <div className="ao-cards-scroll">
        {activeOrders.map(order => (
          <ActiveOrderCard key={order._id} order={order} />
        ))}
      </div>
    </section>
  );
};

/* ─── Main Home Component ───────────────────────────────────────── */
const Home = () => {
  const { addToCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [trendingFood, setTrendingFood] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Animated counters state
  const [counters, setCounters] = useState({ restaurants: 0, orders: 0, customers: 0, riders: 0 });
  const statsRef = useRef(null);
  const hasAnimated = useRef(false);

  const handleAddToCart = (e, foodId) => {
    e.stopPropagation();
    addToCart(foodId, 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, resData, foodData] = await Promise.all([
          restaurantService.getCuisines(),
          restaurantService.getRestaurants({ limit: 4 }),
          menuService.getMenuItems({ limit: 4 })
        ]);

        if (catData.success) setCategories(catData.data);
        if (resData.success) setRestaurants(resData.docs);
        if (foodData.success) setTrendingFood(foodData.docs);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Intersection Observer for animated counters
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateCounters();
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const animateCounters = () => {
    const targets = { restaurants: 50, orders: 10000, customers: 5000, riders: 200 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounters({
        restaurants: Math.round(targets.restaurants * eased),
        orders: Math.round(targets.orders * eased),
        customers: Math.round(targets.customers * eased),
        riders: Math.round(targets.riders * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
  };

  // Mock testimonials
  const testimonials = [
    { name: 'Aarav Sharma', avatar: 'A', rating: 5, text: 'Absolutely love the service! Food arrives hot and fresh every time. The momo from Thamel was incredible!', location: 'Baluwatar' },
    { name: 'Priya Thapa', avatar: 'P', rating: 5, text: 'Best food delivery app in Kathmandu. The tracking feature is amazing — I can see my rider in real-time!', location: 'Lazimpat' },
    { name: 'Rohan KC', avatar: 'R', rating: 4, text: 'Great variety of restaurants. The checkout process is super smooth and delivery is always on time.', location: 'Patan' },
    { name: 'Sujata Devi', avatar: 'S', rating: 5, text: 'I order thali every day for lunch. Quality is consistent and the riders are very polite!', location: 'Baneshwor' },
    { name: 'Bikram Rai', avatar: 'B', rating: 5, text: 'Finally a delivery app that works well in Kathmandu! Payment via eSewa is super convenient.', location: 'Thamel' },
    { name: 'Nisha Gurung', avatar: 'N', rating: 4, text: 'The pizza from Pizza Palace was perfect. Will definitely order again. Great customer support too!', location: 'Jhamsikhel' },
  ];

  const howItWorksSteps = [
    { icon: <Search size={28} />, title: 'Browse', desc: 'Explore restaurants and menus near you' },
    { icon: <ShoppingBag size={28} />, title: 'Order', desc: 'Add items to cart and checkout securely' },
    { icon: <Navigation size={28} />, title: 'Track', desc: 'Watch your rider in real-time on the map' },
    { icon: <Smile size={28} />, title: 'Enjoy', desc: 'Receive hot food at your doorstep' },
  ];

  return (
    <div className="home-page fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Delicious Food <br /> Delivered to your <span className="highlight">Doorstep</span></h1>
          <p>Order from your favorite restaurants and enjoy premium meals in minutes.</p>
          
          <div className="search-bar-container">
            <div className="location-picker">
              <MapPin size={18} color="#121211" />
              <span>Kathmandu, Nepal</span>
            </div>
            <div className="search-divider"></div>
            <div className="search-input-wrapper">
              <input type="text" placeholder="Search for food or restaurants..." />
              <button className="search-btn">
                <Search size={20} />
              </button>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-blob"></div>
          <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000" alt="Delicious Food" />
        </div>
      </section>

      {/* ═══════ ACTIVE ORDERS TRACKING SECTION ═══════ */}
      <ActiveOrdersSection />

      {/* Popular Categories */}
      <section className="categories">
        <div className="section-header">
          <h2>Popular Categories</h2>
          <button className="view-all">View All <ChevronRight size={16} /></button>
        </div>
        <div className="category-grid">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="category-skeleton animate-pulse"></div>)
          ) : (
            categories.map((cat, i) => (
              <div key={i} className="category-card">
                <div className="cat-icon-container">
                  <Utensils size={24} color="#121211" />
                </div>
                <span>{cat}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Explore Restaurants */}
      <section className="featured">
        <div className="section-header">
          <div className="title-with-icon">
            <Zap size={24} color="#121211" fill="#121211" />
            <h2>Explore Restaurants</h2>
          </div>
          <button className="view-all">Explore All <ChevronRight size={16} /></button>
        </div>
        <div className="restaurant-grid">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="restaurant-skeleton animate-pulse"></div>)
          ) : (
            restaurants.map((res) => (
              <div key={res._id} className="restaurant-card" onClick={() => navigate(`/restaurant/${res._id}`)}>
                <div className="card-image">
                  <img src={res.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'} alt={res.name} />
                  <div className="rating-badge">
                    <Star size={14} fill="currentColor" /> {res.rating}
                  </div>
                </div>
                <div className="card-info">
                  <h3>{res.name}</h3>
                  <p>{res.cuisines?.join(', ') || 'Various Cuisines'}</p>
                  <div className="card-meta">
                    <span><Clock size={16} /> <span className="time-tag">{res.openTime} - {res.closeTime}</span></span>
                    <span style={{color: 'var(--success)', fontWeight: '800'}}>Free Delivery</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Trending Dishes */}
      <section className="trending-food">
        <div className="section-header">
          <div className="title-with-icon">
            <Flame size={24} color="#121211" fill="#121211" />
            <h2>Trending Dishes</h2>
          </div>
          <button className="view-all">View All <ChevronRight size={16} /></button>
        </div>
        <div className="food-grid">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="food-skeleton animate-pulse"></div>)
          ) : (
            trendingFood.map((food) => (
              <div key={food._id} className="food-card" onClick={() => navigate(`/food/${food._id}`)}>
                <div className="food-image-wrapper">
                  <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c" alt={food.name} />
                  <button className="add-btn" onClick={(e) => handleAddToCart(e, food._id)}>+</button>
                </div>
                <div className="food-details">
                  <h3>{food.name}</h3>
                  <p className="food-res">{food.restaurant?.name}</p>
                  <div className="food-price-tag">
                    <span className="current-price">Rs. {food.price}</span>
                    {food.isVeg && <div className="veg-icon"></div>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <div className="section-header">
          <div className="title-with-icon">
            <Truck size={24} color="#121211" />
            <h2>How It Works</h2>
          </div>
        </div>
        <div className="steps-grid">
          {howItWorksSteps.map((step, i) => (
            <React.Fragment key={i}>
              <div className="step-card" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="step-number">{i + 1}</div>
                <div className="step-icon-wrap">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              {i < howItWorksSteps.length - 1 && (
                <div className="step-connector">
                  <ChevronRight size={20} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ABOUT US */}
      <section className="about-us">
        <div className="about-content">
          <div className="about-text">
            <span className="about-tag">🍽️ About FoodHub</span>
            <h2>We Deliver <span>Happiness</span> to Your Door</h2>
            <p>
              FoodHub connects you with the best local restaurants in Kathmandu. 
              We're passionate about great food and exceptional delivery experiences. 
              Our mission is to make every meal memorable — from the first tap to the last bite.
            </p>
            <div className="about-values">
              <div className="value-card">
                <Shield size={22} />
                <div>
                  <h4>Safe &amp; Hygienic</h4>
                  <p>Every restaurant partner follows strict safety standards</p>
                </div>
              </div>
              <div className="value-card">
                <Heart size={22} />
                <div>
                  <h4>Made with Love</h4>
                  <p>Curated selection of the best flavors in Kathmandu</p>
                </div>
              </div>
              <div className="value-card">
                <Award size={22} />
                <div>
                  <h4>Top Rated</h4>
                  <p>Trusted by thousands of satisfied customers daily</p>
                </div>
              </div>
            </div>
          </div>
          <div className="about-stats" ref={statsRef}>
            <div className="stat-card primary">
              <span className="stat-number">{counters.restaurants}+</span>
              <span className="stat-label">Partner Restaurants</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{counters.orders.toLocaleString()}+</span>
              <span className="stat-label">Orders Delivered</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{counters.customers.toLocaleString()}+</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{counters.riders}+</span>
              <span className="stat-label">Delivery Riders</span>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS */}
      <section className="customer-reviews">
        <div className="section-header">
          <div className="title-with-icon">
            <Star size={24} color="#121211" fill="#121211" />
            <h2>What Our Customers Say</h2>
          </div>
        </div>
        <div className="reviews-scroll-wrapper">
          <div className="reviews-scroll">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="review-card">
                <div className="review-quote-icon">
                  <Quote size={20} />
                </div>
                <div className="review-stars">
                  {[...Array(5)].map((_, si) => (
                    <Star key={si} size={16} fill={si < t.rating ? '#F59E0B' : 'none'} color={si < t.rating ? '#F59E0B' : '#D1D5DB'} />
                  ))}
                </div>
                <p className="review-text">{t.text}</p>
                <div className="review-author">
                  <div className="review-avatar">{t.avatar}</div>
                  <div>
                    <span className="review-name">{t.name}</span>
                    <span className="review-location">📍 {t.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
