import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChefHat,
  Clock,
  MapPin,
  Navigation,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
} from 'lucide-react';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { getDocs, normalizeMenuItem, normalizeRestaurant } from '../utils/customerData';
import './Home.css';

const activeStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery'];

const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadHome = async () => {
      try {
        const [restaurantRes, menuRes, cuisineRes, ordersRes] = await Promise.all([
          restaurantService.getRestaurants({ limit: 6 }),
          menuService.getMenuItems({ limit: 8, sort: '-createdAt' }),
          restaurantService.getCuisines().catch(() => ({ data: [] })),
          api.get('/orders/my-orders').catch(() => ({ data: { data: [] } })),
        ]);

        if (!mounted) return;
        setRestaurants(getDocs(restaurantRes).map(normalizeRestaurant));
        setMenuItems(getDocs(menuRes).map(normalizeMenuItem));
        setCuisines(getDocs(cuisineRes).slice(0, 8));
        setActiveOrders(getDocs(ordersRes.data).filter((order) => activeStatuses.includes(order.status)));
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHome();
    return () => {
      mounted = false;
    };
  }, []);

  const featuredCategories = useMemo(() => {
    const names = new Set(cuisines);
    menuItems.forEach((item) => names.add(item.categoryName));
    return Array.from(names).filter(Boolean).slice(0, 8);
  }, [cuisines, menuItems]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/explore?search=${encodeURIComponent(query)}` : '/explore');
  };

  const handleAddToCart = (event, id) => {
    event.stopPropagation();
    addToCart(id, 1);
  };

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="eyebrow"><Sparkles size={16} /> Fresh from local kitchens</span>
          <h1>Order meals that are actually available right now.</h1>
          <p>Browse active restaurants, real menu items, and fresh uploads from the backend without stale placeholder data getting in the way.</p>

          <form className="home-search" onSubmit={handleSubmit}>
            <MapPin size={20} />
            <span>Kathmandu</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search dishes, cuisines, or restaurants"
            />
            <button type="submit" aria-label="Search">
              <Search size={20} />
            </button>
          </form>

          <div className="home-quick-stats">
            <div><strong>{restaurants.length || 0}+</strong><span>restaurants</span></div>
            <div><strong>{menuItems.length || 0}+</strong><span>dishes loaded</span></div>
            <div><strong>{featuredCategories.length || 0}</strong><span>categories</span></div>
          </div>
        </div>

        <div className="home-hero-media">
          <img
            src={menuItems[0]?.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000'}
            alt="Fresh restaurant food"
          />
          <div className="hero-floating-card">
            <ChefHat size={20} />
            <div>
              <strong>{menuItems[0]?.name || 'Chef specials'}</strong>
              <span>{menuItems[0]?.restaurantName || 'Ready to explore'}</span>
            </div>
          </div>
        </div>
      </section>

      {activeOrders.length > 0 && (
        <section className="home-section active-orders">
          <div className="section-title-row">
            <div>
              <span className="section-kicker">Live orders</span>
              <h2>Track what is on the way</h2>
            </div>
            <Link to="/orders" className="text-link">My orders <ArrowRight size={16} /></Link>
          </div>
          <div className="active-order-grid">
            {activeOrders.slice(0, 3).map((order) => (
              <Link className="active-order-card" to="/orders?tab=live" key={order._id}>
                <Package size={22} />
                <div>
                  <strong>{order.restaurant?.name || 'Your order'}</strong>
                  <span>{order.status?.replaceAll('_', ' ') || 'pending'} · Rs. {order.total_amount || order.total || 0}</span>
                </div>
                <Navigation size={18} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="home-section">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">Categories</span>
            <h2>Start with a craving</h2>
          </div>
          <Link to="/explore" className="text-link">Explore all <ArrowRight size={16} /></Link>
        </div>
        <div className="category-strip">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <div className="skeleton category-tile" key={index} />)
            : featuredCategories.map((category) => (
                <button
                  className="category-tile"
                  key={category}
                  onClick={() => navigate(`/explore?search=${encodeURIComponent(category)}`)}
                >
                  <Utensils size={22} />
                  <span>{category}</span>
                </button>
              ))}
        </div>
      </section>

      <section className="home-section surface">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">Restaurants</span>
            <h2>Open kitchens to browse</h2>
          </div>
          <Link to="/explore" className="text-link">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="restaurant-grid">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <div className="skeleton restaurant-card" key={index} />)
            : restaurants.map((restaurant) => (
                <article className="restaurant-card" key={restaurant.id} onClick={() => navigate(`/restaurant/${restaurant.id}`)}>
                  <img src={restaurant.image} alt={restaurant.name} />
                  <div className="restaurant-card-body">
                    <div className="card-title-row">
                      <h3>{restaurant.name}</h3>
                      <span><Star size={14} fill="currentColor" /> {restaurant.rating.toFixed(1)}</span>
                    </div>
                    <p>{restaurant.cuisines.join(', ') || restaurant.description || 'Local favorites'}</p>
                    <div className="card-meta-row">
                      <span><MapPin size={15} /> {restaurant.area}</span>
                      <span><Clock size={15} /> {restaurant.hours}</span>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">Menu</span>
            <h2>Fresh dishes from the API</h2>
          </div>
          <Link to="/explore" className="text-link">See menu <ArrowRight size={16} /></Link>
        </div>
        <div className="dish-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <div className="skeleton dish-card" key={index} />)
            : menuItems.map((item) => (
                <article className="dish-card" key={item.id} onClick={() => navigate(`/food/${item.id}`)}>
                  <img src={item.image} alt={item.name} />
                  <div className="dish-card-body">
                    <span className="dish-category">{item.categoryName}</span>
                    <h3>{item.name}</h3>
                    <p>{item.restaurantName}</p>
                    <div className="dish-footer">
                      <strong>Rs. {item.discountPrice || item.price}</strong>
                      <button onClick={(event) => handleAddToCart(event, item.id)} aria-label={`Add ${item.name} to cart`}>
                        <ShoppingBag size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
