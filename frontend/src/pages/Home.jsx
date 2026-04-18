import React from 'react';
import { Search, MapPin, Star, Clock, ChevronRight } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Delicious Food <br /> Delivered to your <span className="highlight">Doorstep</span></h1>
          <p>Order from your favorite restaurants and enjoy premium meals in minutes.</p>
          
          <div className="search-bar-container">
            <div className="location-picker">
              <MapPin size={18} color="#FF6B6B" />
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
          
          <div className="hero-stats">
            <div className="stat-item">
              <strong>500+</strong>
              <span>Restaurants</span>
            </div>
            <div className="stat-item">
              <strong>10k+</strong>
              <span>Happy Customers</span>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-blob"></div>
          <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000" alt="Delicious Food" />
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <div className="section-header">
          <h2>Popular Categories</h2>
          <button className="view-all">View All <ChevronRight size={16} /></button>
        </div>
        <div className="category-grid">
          {['Burgers', 'Pizza', 'Momo', 'Thakali', 'Bakery', 'Healthy'].map((cat, i) => (
            <div key={i} className="category-card">
              <div className="cat-icon-container">
                <img src={`https://source.unsplash.com/random/100x100?${cat}`} alt={cat} />
              </div>
              <span>{cat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="featured">
        <div className="section-header">
          <h2>Featured Restaurants</h2>
          <button className="view-all">Explore All <ChevronRight size={16} /></button>
        </div>
        <div className="restaurant-grid">
          {[1, 2, 3].map((item) => (
            <div key={item} className="restaurant-card">
              <div className="card-image">
                <img src={`https://images.unsplash.com/photo-${1500000000000 + item}?auto=format&fit=crop&q=80&w=500`} alt="Restaurant" />
                <div className="rating-badge">
                  <Star size={14} fill="#FFD93D" color="#FFD93D" /> 4.5
                </div>
              </div>
              <div className="card-info">
                <h3>The Gourmet Kitchen</h3>
                <p>Italian • Burgers • Shakes</p>
                <div className="card-meta">
                  <span><Clock size={14} /> 20-30 min</span>
                  <span className="dot"></span>
                  <span>Free Delivery</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
