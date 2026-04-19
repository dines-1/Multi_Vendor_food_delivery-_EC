import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, ChevronRight, Clock, Flame, Utensils, Zap } from 'lucide-react';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';
import './Home.css';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [trendingFood, setTrendingFood] = useState([]);
  const [loading, setLoading] = useState(true);

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
                  <Utensils size={24} color="#FF6B6B" />
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
            <Zap size={24} color="#FFD700" fill="#FFD700" />
            <h2>Explore Restaurants</h2>
          </div>
          <button className="view-all">Explore All <ChevronRight size={16} /></button>
        </div>
        <div className="restaurant-grid">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="restaurant-skeleton animate-pulse"></div>)
          ) : (
            restaurants.map((res) => (
              <div key={res._id} className="restaurant-card">
                <div className="card-image">
                  <img src={res.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'} alt={res.name} />
                  <div className="rating-badge">
                    <Star size={14} fill="#FFD93D" color="#FFD93D" /> {res.rating}
                  </div>
                </div>
                <div className="card-info">
                  <h3>{res.name}</h3>
                  <p>{res.cuisines?.join(' • ') || 'Various Cuisines'}</p>
                  <div className="card-meta">
                    <span><Clock size={14} /> {res.openTime} - {res.closeTime}</span>
                    <span className="dot"></span>
                    <span>Free Delivery</span>
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
            <Flame size={24} color="#FF4500" fill="#FF4500" />
            <h2>Trending Dishes</h2>
          </div>
          <button className="view-all">View All <ChevronRight size={16} /></button>
        </div>
        <div className="food-grid">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="food-skeleton animate-pulse"></div>)
          ) : (
            trendingFood.map((food) => (
              <div key={food._id} className="food-card">
                <div className="food-image-wrapper">
                  <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c" alt={food.name} />
                  <button className="add-btn">+</button>
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
    </div>
  );
};

export default Home;
