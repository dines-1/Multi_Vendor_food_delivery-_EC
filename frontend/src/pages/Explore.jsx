import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';
import {
  Search,
  Star,
  Clock,
  ShoppingBag,
  Loader2,
  Filter,
  Sparkles,
  Utensils,
  MapPin,
  ChevronRight,
  Flame,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Explore.css';

const Explore = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems]       = useState([]);
  const [loading, setLoading]           = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filtering & Search state
  const [searchQuery, setSearchQuery]       = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRestaurant, setSelectedRestaurant] = useState('All');

  // Sync state when url parameter changes (e.g. from homepage search redirect)
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchQuery(q);
  }, [searchParams]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim()) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Load active data from server
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [resResponse, menuResponse] = await Promise.all([
          restaurantService.getRestaurants({ limit: 100 }),
          menuService.getMenuItems({ limit: 100 })
        ]);

        if (resResponse.success) {
          setRestaurants(resResponse.docs || []);
        }
        if (menuResponse.success) {
          setMenuItems(menuResponse.docs || []);
        }
      } catch (err) {
        toast.error('Failed to load menu items or restaurants');
        console.error('Explore load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Dynamically extract categories that have active items
  const activeCategories = useMemo(() => {
    const categoriesSet = new Set();
    menuItems.forEach(item => {
      if (item.category && item.category.name) {
        categoriesSet.add(item.category.name);
      }
    });
    return ['All', ...Array.from(categoriesSet)];
  }, [menuItems]);

  // Handle adding to cart
  const handleAddToCart = async (e, item) => {
    e.stopPropagation();
    try {
      const res = await addToCart(item._id, 1);
      if (res?.success) {
        toast.success(`Added ${item.name} to cart!`);
      }
    } catch {
      toast.error('Failed to add item to cart');
    }
  };

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // 1. Search Query Filter - searches across Name, Description, Category Name, and Restaurant Name
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
                            item.name.toLowerCase().includes(query) ||
                            (item.description && item.description.toLowerCase().includes(query)) ||
                            (item.category && item.category.name && item.category.name.toLowerCase().includes(query)) ||
                            (item.restaurant && item.restaurant.name && item.restaurant.name.toLowerCase().includes(query));

      // 2. Category / Cuisine Sub-nav Filter
      const matchesCategory = selectedCategory === 'All' || 
                              (item.category && item.category.name === selectedCategory);

      // 3. Restaurant Sidebar Filter
      const matchesRestaurant = selectedRestaurant === 'All' || 
                                (item.restaurant && item.restaurant._id === selectedRestaurant);

      return matchesSearch && matchesCategory && matchesRestaurant;
    });
  }, [menuItems, searchQuery, selectedCategory, selectedRestaurant]);

  return (
    <div className="explore-page animate-fadeIn">
      {/* Search & Hero Banner Section */}
      <section className="explore-hero">
        <div className="explore-hero-inner">
          <div className="explore-badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Discover your new favorites</span>
          </div>
          <h1>Explore Food &amp; Restaurants</h1>
          <p>Find the best local dishes, customized meals, and authentic cuisines instantly.</p>
          
          <div className="explore-search-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search dishes, snacks, categories, or restaurants..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={handleClearSearch}>×</button>
            )}
          </div>
        </div>
      </section>

      <div className="explore-container">
        {/* Left Sidebar - Minimalist Restaurant Filters */}
        <aside className="explore-sidebar">
          <div className="sidebar-header">
            <Filter size={16} />
            <h3>Restaurants</h3>
          </div>
          <div className="sidebar-menu">
            <button
              className={`sidebar-item ${selectedRestaurant === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedRestaurant('All')}
            >
              <div className="sidebar-icon-sq all">
                <Utensils size={16} />
              </div>
              <span className="sidebar-label">All Restaurants</span>
            </button>

            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="sidebar-item-skeleton animate-pulse"></div>
              ))
            ) : (
              restaurants.map(res => {
                const isActive = selectedRestaurant === res._id;
                return (
                  <button
                    key={res._id}
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedRestaurant(res._id)}
                  >
                    <img
                      src={res.logo_url || 'https://via.placeholder.com/32'}
                      alt={res.name}
                      className="sidebar-logo-sq"
                    />
                    <div className="sidebar-label-group">
                      <span className="sidebar-label">{res.name}</span>
                      <span className="sidebar-sub">
                        <Star size={11} fill="currentColor" /> {res.rating || '4.0'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="explore-main">
          {/* Top Horizontal Sub-navigation for Categories */}
          <div className="explore-subnav-scroll">
            <div className="explore-subnav">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="subnav-pill-skeleton animate-pulse"></div>
                ))
              ) : (
                activeCategories.map(cat => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      className={`subnav-pill ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === 'All' && <Flame size={14} />}
                      <span>{cat}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Dynamic Food Items Grid */}
          {loading ? (
            <div className="explore-items-grid">
              {[1, 2, 3, 4, 6].map(i => (
                <div key={i} className="explore-card-skeleton animate-pulse"></div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="explore-empty-state">
              <AlertCircle size={48} className="empty-icon" />
              <h2>No dishes found</h2>
              <p>Try clearing your active filters, refining your search, or selecting another restaurant.</p>
              <button
                className="btn-reset-filters"
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                  setSelectedCategory('All');
                  setSelectedRestaurant('All');
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="explore-items-grid">
              {filteredItems.map(item => {
                const discounted = item.discountPrice && item.discountPrice < item.price;
                return (
                  <div
                    key={item._id}
                    className="explore-food-card animate-cardIn"
                    onClick={() => navigate(`/food/${item._id}`)}
                  >
                    <div className="explore-card-image-wrap">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                        alt={item.name}
                        className="explore-card-image"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
                        }}
                      />
                      <div className="explore-card-badges">
                        <span className={`veg-badge-dot ${item.isVeg ? 'veg' : 'nonveg'}`} title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'} />
                        {item.preparationTime && (
                          <span className="prep-time-badge">
                            <Clock size={11} /> {item.preparationTime} min
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="explore-card-body">
                      <div className="explore-card-rest-tag">
                        <Utensils size={11} />
                        <span>{item.restaurant?.name || 'Local Kitchen'}</span>
                      </div>
                      <h3 className="explore-card-title">{item.name}</h3>
                      <p className="explore-card-desc">
                        {item.description || 'Delectable food crafted with high-quality local ingredients.'}
                      </p>

                      <div className="explore-card-footer">
                        <div className="explore-card-prices">
                          {discounted ? (
                            <>
                              <span className="current-price">Rs. {item.discountPrice}</span>
                              <span className="original-price strike">Rs. {item.price}</span>
                            </>
                          ) : (
                            <span className="current-price">Rs. {item.price}</span>
                          )}
                        </div>

                        <button
                          className="btn-add-explore"
                          onClick={(e) => handleAddToCart(e, item)}
                          title="Add to Cart"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Explore;
