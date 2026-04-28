import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Star, ChevronRight, Clock, Flame, Utensils, Zap, Truck, ShoppingBag, Navigation, Smile, Shield, Heart, Award, Quote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';
import { useCart } from '../context/CartContext';
import './Home.css';

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

      {/* ========== HOW IT WORKS ========== */}
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

      {/* ========== ABOUT US ========== */}
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
                  <h4>Safe & Hygienic</h4>
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

      {/* ========== CUSTOMER REVIEWS ========== */}
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
