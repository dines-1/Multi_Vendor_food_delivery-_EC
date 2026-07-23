import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Clock,
  Filter,
  MapPin,
  Search,
  ShoppingBag,
  Star,
  Utensils,
  X,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';
import { getDocs, normalizeMenuItem, normalizeRestaurant } from '../utils/customerData';
import './Explore.css';

const Explore = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRestaurant, setSelectedRestaurant] = useState('All');

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    const loadExplore = async () => {
      try {
        setLoading(true);
        const [restaurantRes, menuRes] = await Promise.all([
          restaurantService.getRestaurants({ limit: 100 }),
          menuService.getMenuItems({ limit: 100 }),
        ]);

        if (!mounted) return;
        setRestaurants(getDocs(restaurantRes).map(normalizeRestaurant));
        setMenuItems(getDocs(menuRes).map(normalizeMenuItem));
      } catch (error) {
        console.error('Explore load error:', error);
        toast.error('Failed to load restaurants and dishes');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadExplore();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const names = new Set(menuItems.map((item) => item.categoryName).filter(Boolean));
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesSearch = !query || [
        item.name,
        item.description,
        item.categoryName,
        item.restaurantName,
      ].some((value) => String(value || '').toLowerCase().includes(query));

      const matchesCategory = selectedCategory === 'All' || item.categoryName === selectedCategory;
      const matchesRestaurant = selectedRestaurant === 'All' || item.restaurantId === selectedRestaurant;

      return matchesSearch && matchesCategory && matchesRestaurant;
    });
  }, [menuItems, searchQuery, selectedCategory, selectedRestaurant]);

  const updateSearch = (value) => {
    setSearchQuery(value);
    const next = value.trim();
    setSearchParams(next ? { search: next } : {});
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedRestaurant('All');
    setSearchParams({});
  };

  const handleAddToCart = async (event, item) => {
    event.stopPropagation();
    await addToCart(item.id, 1);
  };

  return (
    <div className="ex-page">
      <section className="ex-hero">
        <div className="ex-hero-copy">
          <span className="ex-kicker">
            <Utensils size={14} />
            Full menu, one ledger
          </span>
          <h1>Explore restaurants &amp; dishes</h1>
          <p>Search every dish on the books, then narrow it down by kitchen or category.</p>
        </div>

        <div className="ex-search">
          <Search size={18} />
          <input
            value={searchQuery}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search food, category, or restaurant"
          />
          {searchQuery && (
            <button type="button" className="ex-search-clear" onClick={() => updateSearch('')} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
      </section>

      <div className="ex-layout">
        <aside className="ex-filters">
          <div className="ex-filter-title">
            <Filter size={13} />
            Restaurants
          </div>

          <button
            type="button"
            className={`ex-filter-row ${selectedRestaurant === 'All' ? 'is-active' : ''}`}
            onClick={() => setSelectedRestaurant('All')}
          >
            <span className="ex-filter-icon">
              <Utensils size={15} />
            </span>
            <span className="ex-filter-name">All restaurants</span>
          </button>

          {loading
            ? Array.from({ length: 5 }).map((_, index) => <div className="ex-filter-skeleton" key={index} />)
            : restaurants.map((restaurant) => (
                <button
                  type="button"
                  key={restaurant.id}
                  className={`ex-filter-row ${selectedRestaurant === restaurant.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedRestaurant(restaurant.id)}
                >
                  <img className="ex-filter-avatar" src={restaurant.image} alt={restaurant.name} />
                  <span className="ex-filter-name">{restaurant.name}</span>
                  <small className="ex-filter-rating">
                    <Star size={10} fill="currentColor" />
                    {restaurant.rating.toFixed(1)}
                  </small>
                </button>
              ))}
        </aside>

        <main className="ex-results">
          <nav className="ex-category-nav">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <div className="ex-category-skeleton" key={index} />)
              : categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={selectedCategory === category ? 'is-active' : ''}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
          </nav>

          <div className="ex-summary">
            <strong>{filteredItems.length}</strong>
            <span>{filteredItems.length === 1 ? 'dish' : 'dishes'} found</span>
          </div>

          {loading ? (
            <div className="ex-grid">
              {Array.from({ length: 8 }).map((_, index) => <div className="ex-card-skeleton" key={index} />)}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="ex-empty">
              <AlertCircle size={38} />
              <h2>No matching dishes</h2>
              <p>Clear the filters, or try another restaurant, cuisine, or dish name.</p>
              <button type="button" onClick={resetFilters}>Reset filters</button>
            </div>
          ) : (
            <div className="ex-grid">
              {filteredItems.map((item, index) => (
                <article
                  className="ex-card"
                  key={item.id}
                  style={{ '--ex-delay': `${(index % 8) * 45}ms` }}
                  onClick={() => navigate(`/food/${item.id}`)}
                >
                  <div className="ex-card-image">
                    <img src={item.image} alt={item.name} />
                    <span className={item.isVeg ? 'ex-veg is-veg' : 'ex-veg is-nonveg'} />
                  </div>
                  <div className="ex-card-body">
                    <div className="ex-card-restaurant">
                      <Utensils size={12} />
                      <span>{item.restaurantName}</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="ex-card-meta">
                      <span>
                        <Clock size={13} />
                        {item.preparationTime} min
                      </span>
                      <span>
                        <MapPin size={13} />
                        {item.categoryName}
                      </span>
                    </div>
                    <div className="ex-card-footer">
                      <strong>Rs. {item.price}</strong>
                      <button type="button" className="ex-add-btn" onClick={(event) => handleAddToCart(event, item)}>
                        <ShoppingBag size={15} />
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Explore;