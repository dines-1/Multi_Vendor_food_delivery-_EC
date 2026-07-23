import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Zap,
  Gift,
  TrendingUp,
  Users,
  Bike,
  Store,
  Heart,
  CheckCircle,
  Soup,
  Pizza,
  UtensilsCrossed,
  Sandwich,
  Utensils,
  Beef,
  Fish,
} from 'lucide-react';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { getDocs, normalizeMenuItem, normalizeRestaurant } from '../utils/customerData';
import './Home.css';

const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery'];

const CATEGORIES = [
  { name: 'Momos', icon: Soup },
  { name: 'Pizza', icon: Pizza },
  { name: 'Thali', icon: UtensilsCrossed },
  { name: 'Burgers', icon: Sandwich },
  { name: 'Noodles', icon: Utensils },
  { name: 'Curry', icon: Beef },
  { name: 'Sushi', icon: Fish },
];

const TESTIMONIALS = [
  { initials: 'RK', name: 'Rajan K.', area: 'Thamel', stars: 5, text: 'Finally an app where what I see is what\'s actually available. No more ordering something already sold out.' },
  { initials: 'SP', name: 'Sita P.', area: 'Lazimpat', stars: 5, text: 'Real delivery times, live tracking, and the momos arrived hot. The 30-minute guarantee is real.' },
  { initials: 'AM', name: 'Anil M.', area: 'Baluwatar', stars: 4, text: 'Live menu categories helped me discover three restaurants I never knew existed in my area.' },
];

/* Wraps a section/card so it fades + rises in the first time it scrolls
   into view, instead of everything appearing at once. `stagger` (ms)
   offsets siblings in a grid so they cascade in rather than pop together. */
const Reveal = ({ children, as: Tag = 'div', className = '', stagger = 0, ...rest }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`hm-reveal ${visible ? 'hm-reveal-visible' : ''} ${className}`.trim()}
      style={{ transitionDelay: `${stagger}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

/* Counts a stat up to its target once the data has loaded, rather than
   having the number just appear. */
const useCountUp = (target, active, duration = 900) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || typeof target !== 'number') return undefined;
    let frame;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);
  return value;
};

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
        return { name, icon: match?.icon || Utensils };
      })
    : CATEGORIES;

  const restaurantCount = useCountUp(restaurants.length, !loading);
  const dishCount = useCountUp(menuItems.length, !loading);
  const categoryCount = useCountUp(displayCategories.length, !loading);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/explore?search=${encodeURIComponent(q)}` : '/explore');
  };

  const handleAddToCart = (e, id) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.classList.add('hm-bounce');
    setTimeout(() => btn.classList.remove('hm-bounce'), 350);
    addToCart(id, 1);
  };

  return (
    <div className="hm-scope hm-page">

      {/* ── HERO ── */}
      <section className="hm-hero">
        <div className="hm-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80"
            alt="Delicious food spread"
            className="hm-hero-bg-img"
          />
          <div className="hm-hero-overlay" />
        </div>

        <div className="hm-hero-content">
          <span className="hm-eyebrow hm-hero-anim hm-hero-anim-1">
            <Zap size={13} /> Fresh from local kitchens &middot; Kathmandu
          </span>
          <h1 className="hm-hero-title hm-hero-anim hm-hero-anim-2">
            Food you love,<br />
            <em>at your door</em>
          </h1>
          <hr className="hm-rule hm-rule--light hm-rule--intro" />
          <p className="hm-hero-sub hm-hero-anim hm-hero-anim-3">
            Real menu items, live restaurants, fresh from the kitchen.
            No stale placeholders, no guesswork.
          </p>

          <form className="hm-hero-search hm-hero-anim hm-hero-anim-4" onSubmit={handleSubmit}>
            <MapPin size={16} className="hm-search-pin" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes, cuisines, or restaurants..."
            />
            <button type="submit" className="hm-search-btn" aria-label="Search">
              <Search size={16} />
              <span>Search</span>
            </button>
          </form>

          <div className="hm-hero-stats hm-hero-anim hm-hero-anim-5">
            <div className="hm-hero-stat">
              <strong>{loading ? '—' : `${restaurantCount}+`}</strong>
              <span>Restaurants</span>
            </div>
            <div className="hm-hero-stat-divider" />
            <div className="hm-hero-stat">
              <strong>{loading ? '—' : `${dishCount}+`}</strong>
              <span>Dishes</span>
            </div>
            <div className="hm-hero-stat-divider" />
            <div className="hm-hero-stat">
              <strong>{loading ? '—' : categoryCount}</strong>
              <span>Categories</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVE ORDERS ── */}
      {activeOrders.length > 0 && (
        <section className="hm-section">
          <Reveal as="div" className="hm-section-header">
            <div>
              <span className="hm-eyebrow hm-eyebrow--dark">Live</span>
              <h2>Track what&rsquo;s on the way</h2>
              <hr className="hm-rule" />
            </div>
            <Link to="/orders" className="hm-see-all">My orders <ArrowRight size={15} /></Link>
          </Reveal>
          <div className="hm-active-order-grid">
            {activeOrders.slice(0, 3).map((order, i) => (
              <Reveal as={Link} stagger={i * 70} className="hm-card hm-active-order-card" to="/orders?tab=live" key={order._id}>
                <div className="hm-order-card-icon">
                  <Package size={19} />
                </div>
                <div className="hm-order-card-info">
                  <strong>{order.restaurant?.name || 'Your order'}</strong>
                  <span className="hm-order-status-wrap">
                    <span className="hm-pulse-dot" />
                    <span className="hm-status-text">{order.status?.replaceAll('_', ' ')}</span>
                    <span className="hm-status-divider">&bull;</span>
                    <span className="hm-mono hm-status-price">Rs. {order.total_amount || order.total || 0}</span>
                  </span>
                </div>
                <Navigation size={15} className="hm-order-nav-icon" />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── PROMO STRIP ── */}
      <div className="hm-promo-strip">
        <Reveal as="div" className="hm-card hm-promo-card">
          <div className="hm-promo-icon"><Gift size={20} /></div>
          <div className="hm-promo-copy">
            <strong>Free delivery on your first order</strong>
            <span>New here? Your first delivery is on us.</span>
          </div>
          <button className="hm-btn hm-btn--primary" onClick={() => navigate('/explore')}>
            Claim <ArrowRight size={14} />
          </button>
        </Reveal>
        <Reveal as="div" stagger={90} className="hm-card hm-promo-card">
          <div className="hm-promo-icon"><Clock size={20} /></div>
          <div className="hm-promo-copy">
            <strong>30-minute guarantee</strong>
            <span>Late? Your next meal is free.</span>
          </div>
          <button className="hm-btn hm-btn--primary" onClick={() => navigate('/explore')}>
            Order now <ArrowRight size={14} />
          </button>
        </Reveal>
      </div>

      {/* ── CATEGORIES ── */}
      <section className="hm-section">
        <Reveal as="div" className="hm-section-header">
          <div>
            <span className="hm-eyebrow hm-eyebrow--dark">Categories</span>
            <h2>Start with a craving</h2>
            <hr className="hm-rule" />
          </div>
          <Link to="/explore" className="hm-see-all">Explore all <ArrowRight size={15} /></Link>
        </Reveal>
        <div className="hm-category-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <div className="hm-skeleton hm-cat-tile" key={i} />)
            : displayCategories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <Reveal
                    as="button"
                    stagger={i * 50}
                    className="hm-cat-tile"
                    key={cat.name}
                    onClick={() => navigate(`/explore?search=${encodeURIComponent(cat.name)}`)}
                  >
                    <span className="hm-cat-icon"><Icon size={20} /></span>
                    <span className="hm-cat-name">{cat.name}</span>
                  </Reveal>
                );
              })}
        </div>
      </section>

      {/* ── RESTAURANTS ── */}
      <section className="hm-section hm-section--sunken">
        <Reveal as="div" className="hm-section-header">
          <div>
            <span className="hm-eyebrow hm-eyebrow--dark">Restaurants</span>
            <h2>Open kitchens near you</h2>
            <hr className="hm-rule" />
          </div>
          <Link to="/explore" className="hm-see-all">View all <ArrowRight size={15} /></Link>
        </Reveal>
        <div className="hm-restaurant-grid">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <div className="hm-skeleton hm-restaurant-card" key={i} />)
            : restaurants.length === 0
              ? (
                <div className="hm-empty">
                  <ChefHat size={30} />
                  <h3>No active restaurants yet</h3>
                  <p>Restaurants appear here once an admin marks them active.</p>
                </div>
              )
              : restaurants.map((r, i) => (
                <Reveal as="article" stagger={i * 80} className="hm-card hm-restaurant-card" key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)}>
                  <div className="hm-r-img-wrap">
                    <img src={r.image} alt={r.name} />
                    <span className="hm-r-rating-badge"><Star size={11} fill="currentColor" /> {r.rating.toFixed(1)}</span>
                  </div>
                  <div className="hm-r-card-body">
                    <h3>{r.name}</h3>
                    <p className="hm-r-cuisines">{r.cuisines.join(', ') || r.description || 'Local favorites'}</p>
                    <div className="hm-r-meta">
                      <span><MapPin size={12} /> {r.area}</span>
                      <span><Clock size={12} /> {r.hours}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
        </div>
      </section>

      {/* ── MENU DISHES ── */}
      <section className="hm-section">
        <Reveal as="div" className="hm-section-header">
          <div>
            <span className="hm-eyebrow hm-eyebrow--dark">Menu</span>
            <h2>Fresh dishes from the kitchen</h2>
            <hr className="hm-rule" />
          </div>
          <Link to="/explore" className="hm-see-all">See all <ArrowRight size={15} /></Link>
        </Reveal>
        <div className="hm-dish-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <div className="hm-skeleton hm-dish-card" key={i} />)
            : menuItems.map((item, i) => (
                <Reveal as="article" stagger={i * 60} className="hm-card hm-dish-card" key={item.id} onClick={() => navigate(`/food/${item.id}`)}>
                  <div className="hm-dish-img-wrap">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="hm-dish-card-body">
                    <span className="hm-badge hm-badge--wine">{item.categoryName}</span>
                    <h3>{item.name}</h3>
                    <p className="hm-dish-restaurant">{item.restaurantName}</p>
                    <div className="hm-dish-footer">
                      <strong className="hm-mono hm-dish-price">Rs. {item.price}</strong>
                      <button
                        className="hm-btn--icon"
                        onClick={(e) => handleAddToCart(e, item.id)}
                        aria-label={`Add ${item.name} to cart`}
                      >
                        <ShoppingBag size={15} />
                      </button>
                    </div>
                  </div>
                </Reveal>
              ))}
        </div>
      </section>

      {/* ── ABOUT US TEASER ── */}
      <section className="hm-about-teaser">
        <Reveal as="div" className="hm-about-teaser-inner">
          <div className="hm-about-teaser-visual">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
              alt="Our team delivering food"
            />
            <div className="hm-about-teaser-badge">
              <Heart size={17} fill="currentColor" />
              <span>Serving Kathmandu since 2020</span>
            </div>
          </div>
          <div className="hm-about-teaser-text">
            <span className="hm-eyebrow hm-eyebrow--dark">Who we are</span>
            <h2>Built for Kathmandu, by people who live here</h2>
            <hr className="hm-rule" />
            <p>
              We started because we were tired of cold food, wrong orders, and
              restaurants that were "available" but never actually open. Today we
              connect thousands of hungry people with the kitchens they love —
              fast, reliably, and honestly.
            </p>
            <ul className="hm-about-perks">
              <li><CheckCircle size={16} /> Live inventory — no ghost menu items</li>
              <li><CheckCircle size={16} /> 30-minute delivery or your next order is free</li>
              <li><CheckCircle size={16} /> Rider earnings go directly to our team</li>
            </ul>
            <Link to="/about" className="hm-btn hm-btn--text-lg">
              Learn more about us <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── LIST YOUR RESTAURANT ── */}
      <section className="hm-partner-section">
        <div className="hm-partner-bg">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80"
            alt="Restaurant kitchen"
          />
          <div className="hm-partner-overlay" />
        </div>
        <Reveal as="div" className="hm-partner-inner">
          <div className="hm-partner-text">
            <span className="hm-eyebrow hm-eyebrow--light">Partner with us</span>
            <h2>List your restaurant.<br />Reach 500,000+ customers.</h2>
            <hr className="hm-rule hm-rule--light" />
            <p>
              Join Kathmandu's fastest-growing food platform. We handle delivery,
              payments, and customer support — you focus on the food.
            </p>
            <div className="hm-partner-perks">
              <div className="hm-partner-perk">
                <TrendingUp size={19} />
                <div>
                  <strong>Grow your reach</strong>
                  <span>Get discovered by new customers daily</span>
                </div>
              </div>
              <div className="hm-partner-perk">
                <Bike size={19} />
                <div>
                  <strong>We deliver</strong>
                  <span>Our riders handle every drop-off</span>
                </div>
              </div>
              <div className="hm-partner-perk">
                <Users size={19} />
                <div>
                  <strong>Dedicated support</strong>
                  <span>A real person to call, always</span>
                </div>
              </div>
            </div>
            <button className="hm-btn hm-btn--brass" onClick={() => navigate('/register-restaurant')}>
              <Store size={17} />
              Register your restaurant
              <ArrowRight size={15} />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="hm-section hm-section--sunken">
        <Reveal as="div" className="hm-section-header">
          <div>
            <span className="hm-eyebrow hm-eyebrow--dark">Reviews</span>
            <h2>Kathmandu eats, honestly</h2>
            <hr className="hm-rule" />
          </div>
        </Reveal>
        <div className="hm-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <Reveal as="div" stagger={i * 90} className="hm-card hm-testimonial-card" key={t.name}>
              <div className="hm-t-stars">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star key={si} size={13} fill={si < t.stars ? 'currentColor' : 'none'} />
                ))}
              </div>
              <p className="hm-t-text">&ldquo;{t.text}&rdquo;</p>
              <div className="hm-t-author">
                <div className="hm-t-avatar">{t.initials}</div>
                <div>
                  <div className="hm-t-name">{t.name}</div>
                  <div className="hm-t-area">{t.area}, Kathmandu</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;
