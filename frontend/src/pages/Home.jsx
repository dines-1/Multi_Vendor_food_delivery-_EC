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
  Star,
  Utensils,
  Zap,
  Gift,
} from 'lucide-react';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { getDocs, normalizeMenuItem, normalizeRestaurant } from '../utils/customerData';
import './Home.css';

const activeStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery'];

const FLOATING_ITEMS = [
  { emoji: '🍜', label: 'Thukpa', x: '8%', y: '18%', delay: '0s', duration: '6s' },
  { emoji: '🥟', label: 'Momos', x: '82%', y: '12%', delay: '1s', duration: '7s' },
  { emoji: '🍕', label: 'Pizza', x: '75%', y: '68%', delay: '2s', duration: '5.5s' },
  { emoji: '🍛', label: 'Dal Bhat', x: '5%', y: '72%', delay: '0.5s', duration: '6.5s' },
  { emoji: '🧁', label: 'Dessert', x: '50%', y: '5%', delay: '1.5s', duration: '7.5s' },
  { emoji: '🥗', label: 'Salad', x: '88%', y: '42%', delay: '3s', duration: '5s' },
];

const CATEGORIES = [
  { name: 'Momos', icon: '🥟' },
  { name: 'Pizza', icon: '🍕' },
  { name: 'Thali', icon: '🍱' },
  { name: 'Burgers', icon: '🍔' },
  { name: 'Noodles', icon: '🍜' },
  { name: 'Curry', icon: '🥘' },
  { name: 'Sushi', icon: '🍣' },
  { name: 'Desserts', icon: '🧁' },
];

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
        setActiveOrders(
          getDocs(ordersRes.data).filter((o) => activeStatuses.includes(o.status))
        );
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadHome();
    return () => { mounted = false; };
  }, []);

  const featuredCategories = useMemo(() => {
    const names = new Set(cuisines);
    menuItems.forEach((item) => names.add(item.categoryName));
    return Array.from(names).filter(Boolean).slice(0, 8);
  }, [cuisines, menuItems]);

  const displayCategories = featuredCategories.length > 0
    ? featuredCategories.map((name) => {
      const match = CATEGORIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
      return { name, icon: match?.icon || '🍽️' };
    })
    : CATEGORIES;

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/explore?search=${encodeURIComponent(q)}` : '/explore');
  };

  const handleAddToCart = (e, id) => {
    e.stopPropagation();
    addToCart(id, 1);
  };

  return (
    <div className="home-page">

      {/* ── HERO ── */}
      <section className="home-hero">
        <div className="hero-container">
          <div className="hero-text-side">
            <span className="hero-eyebrow">
              <Zap size={14} /> Fresh from local kitchens · Kathmandu
            </span>
            <h1 className="hero-title">
              Meals that are <em>actually</em> available right now
            </h1>
            <p className="hero-sub">
              Real menu items, live restaurants, fresh from the kitchen. No stale placeholders, no guesswork.
            </p>

            <form className="hero-search" onSubmit={handleSubmit}>
              <MapPin size={17} className="search-pin" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes, cuisines, or restaurants…"
              />
              <button type="submit" className="search-btn" aria-label="Search">
                <Search size={17} />
                <span>Search</span>
              </button>
            </form>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{loading ? '—' : `${restaurants.length}+`}</strong>
                <span>restaurants</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>{loading ? '—' : `${menuItems.length}+`}</strong>
                <span>dishes</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>{loading ? '—' : displayCategories.length}</strong>
                <span>categories</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-side" aria-hidden="true">
            <div className="hero-food-orbit">
              {FLOATING_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="food-float"
                  style={{ left: item.x, top: item.y, animationDelay: item.delay, animationDuration: item.duration }}
                >
                  <span className="food-float-emoji">{item.emoji}</span>
                  <span className="food-float-label">{item.label}</span>
                </div>
              ))}
              <div className="orbit-ring ring-1" />
              <div className="orbit-ring ring-2" />
              <div className="orbit-center">
                <span>🍽️</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVE ORDERS ── */}
      {activeOrders.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <div>
              <span className="section-kicker">Live</span>
              <h2>Track what's on the way</h2>
            </div>
            <Link to="/orders" className="see-all-link">My orders <ArrowRight size={15} /></Link>
          </div>
          <div className="active-order-grid">
            {activeOrders.slice(0, 3).map((order) => (
              <Link className="active-order-card" to="/orders?tab=live" key={order._id}>
                <div className="order-card-icon">
                  <Package size={20} />
                </div>
                <div className="order-card-info">
                  <strong>{order.restaurant?.name || 'Your order'}</strong>
                  <span className="order-status-wrap">
                    <span className="pulse-dot" />
                    <span className="status-text">{order.status?.replaceAll('_', ' ')}</span>
                    <span className="status-divider">·</span>
                    <span className="status-price">Rs. {order.total_amount || order.total || 0}</span>
                  </span>
                </div>
                <Navigation size={16} className="order-nav-icon" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── PROMO STRIP ── */}
      <div className="promo-strip">
        <div className="promo-card promo-orange">
          <Gift size={22} className="promo-icon" />
          <div>
            <strong>Free delivery on your first order</strong>
            <span>New here? Your first delivery is on us.</span>
          </div>
          <button className="promo-cta" onClick={() => navigate('/explore')}>
            Claim <ArrowRight size={14} />
          </button>
        </div>
        <div className="promo-card promo-green">
          <Clock size={22} className="promo-icon" />
          <div>
            <strong>30-min guarantee</strong>
            <span>Late? Your next meal is free.</span>
          </div>
          <button className="promo-cta" onClick={() => navigate('/explore')}>
            Order now <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <span className="section-kicker">Categories</span>
            <h2>Start with a craving</h2>
          </div>
          <Link to="/explore" className="see-all-link">Explore all <ArrowRight size={15} /></Link>
        </div>
        <div className="category-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <div className="skeleton cat-tile" key={i} />)
            : displayCategories.map((cat) => (
              <button
                className="cat-tile"
                key={cat.name}
                onClick={() => navigate(`/explore?search=${encodeURIComponent(cat.name)}`)}
              >
                <span className="cat-emoji">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </button>
            ))}
        </div>
      </section>

      {/* ── RESTAURANTS ── */}
      <section className="home-section home-section--surface">
        <div className="section-header">
          <div>
            <span className="section-kicker">Restaurants</span>
            <h2>Open kitchens near you</h2>
          </div>
          <Link to="/explore" className="see-all-link">View all <ArrowRight size={15} /></Link>
        </div>
        <div className="restaurant-grid">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <div className="skeleton restaurant-card" key={i} />)
            : restaurants.length === 0
              ? (
                <div className="empty-state">
                  <ChefHat size={32} />
                  <h3>No active restaurants yet</h3>
                  <p>Restaurants appear here once an admin marks them active.</p>
                </div>
              )
              : restaurants.map((r) => (
                <article className="restaurant-card" key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)}>
                  <div className="r-card-img-wrap">
                    <img src={r.image} alt={r.name} />
                    <span className="r-rating-badge"><Star size={12} fill="currentColor" /> {r.rating.toFixed(1)}</span>
                  </div>
                  <div className="r-card-body">
                    <h3>{r.name}</h3>
                    <p className="r-cuisines">{r.cuisines.join(', ') || r.description || 'Local favorites'}</p>
                    <div className="r-meta">
                      <span><MapPin size={13} /> {r.area}</span>
                      <span><Clock size={13} /> {r.hours}</span>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </section>

      {/* ── MENU DISHES ── */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <span className="section-kicker">Menu</span>
            <h2>Fresh dishes from the kitchen</h2>
          </div>
          <Link to="/explore" className="see-all-link">See all <ArrowRight size={15} /></Link>
        </div>
        <div className="dish-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <div className="skeleton dish-card" key={i} />)
            : menuItems.map((item) => (
              <article className="dish-card" key={item.id} onClick={() => navigate(`/food/${item.id}`)}>
                <div className="dish-img-wrap">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="dish-card-body">
                  <span className="dish-category">{item.categoryName}</span>
                  <h3>{item.name}</h3>
                  <p className="dish-restaurant">{item.restaurantName}</p>
                  <div className="dish-footer">
                    <strong className="dish-price">Rs. {item.price}</strong>
                    <button
                      className="add-cart-btn"
                      onClick={(e) => handleAddToCart(e, item.id)}
                      aria-label={`Add ${item.name} to cart`}
                    >
                      <ShoppingBag size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="home-section home-section--surface">
        <div className="section-header">
          <div>
            <span className="section-kicker">Reviews</span>
            <h2>Kathmandu eats, honestly</h2>
          </div>
        </div>
        <div className="testimonials-grid">
          {[
            { initials: 'RK', name: 'Rajan K.', area: 'Thamel', stars: 5, text: 'Finally an app where what I see is what\'s actually available. No more ordering something already sold out.' },
            { initials: 'SP', name: 'Sita P.', area: 'Lazimpat', stars: 5, text: 'Real delivery times, live tracking, and the momos arrived hot. The 30-minute guarantee is real.' },
            { initials: 'AM', name: 'Anil M.', area: 'Baluwatar', stars: 4, text: 'Live menu categories helped me discover three restaurants I never knew existed in my area.' },
          ].map((t) => (
            <div className="testimonial-card" key={t.name}>
              <div className="t-stars">{'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}</div>
              <p className="t-text">"{t.text}"</p>
              <div className="t-author">
                <div className="t-avatar">{t.initials}</div>
                <div>
                  <div className="t-name">{t.name}</div>
                  <div className="t-area">{t.area}, Kathmandu</div>
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