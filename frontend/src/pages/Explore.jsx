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
    <div className="explore-page">
      <section className="explore-header">
        <div>
          <span className="explore-kicker"><Utensils size={15} /> Browse customer menu</span>
          <h1>Explore restaurants and dishes</h1>
          <p>Search across real menu documents, populated categories, and active restaurants from the backend.</p>
        </div>
        <div className="explore-search">
          <Search size={20} />
          <input
            value={searchQuery}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search food, category, or restaurant"
          />
          {searchQuery && (
            <button type="button" onClick={() => updateSearch('')} aria-label="Clear search">
              <X size={18} />
            </button>
          )}
        </div>
      </section>

      <div className="explore-layout">
        <aside className="explore-filters">
          <div className="filter-title"><Filter size={16} /> Restaurants</div>
          <button
            className={`filter-row ${selectedRestaurant === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedRestaurant('All')}
          >
            <span className="filter-avatar"><Utensils size={16} /></span>
            <span>All restaurants</span>
          </button>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => <div className="filter-skeleton" key={index} />)
            : restaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  className={`filter-row ${selectedRestaurant === restaurant.id ? 'active' : ''}`}
                  onClick={() => setSelectedRestaurant(restaurant.id)}
                >
                  <img src={restaurant.image} alt={restaurant.name} />
                  <span>{restaurant.name}</span>
                  <small><Star size={11} fill="currentColor" /> {restaurant.rating.toFixed(1)}</small>
                </button>
              ))}
        </aside>

        <main className="explore-results">
          <div className="category-nav">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <div className="category-skeleton" key={index} />)
              : categories.map((category) => (
                  <button
                    key={category}
                    className={selectedCategory === category ? 'active' : ''}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
          </div>

          <div className="results-summary">
            <strong>{filteredItems.length}</strong>
            <span>{filteredItems.length === 1 ? 'dish' : 'dishes'} found</span>
          </div>

          {loading ? (
            <div className="explore-items-grid">
              {Array.from({ length: 8 }).map((_, index) => <div className="explore-card-skeleton" key={index} />)}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="explore-empty-state">
              <AlertCircle size={44} />
              <h2>No matching dishes</h2>
              <p>Clear filters or try another restaurant, cuisine, or dish name.</p>
              <button onClick={resetFilters}>Reset filters</button>
            </div>
          ) : (
            <div className="explore-items-grid">
              {filteredItems.map((item) => {
                const hasDiscount = item.discountPrice && item.discountPrice < item.price;

                return (
                  <article
                    className="explore-food-card"
                    key={item.id}
                    onClick={() => navigate(`/food/${item.id}`)}
                  >
                    <div className="explore-image-wrap">
                      <img src={item.image} alt={item.name} />
                      <span className={item.isVeg ? 'veg-badge veg' : 'veg-badge nonveg'} />
                    </div>
                    <div className="explore-card-body">
                      <div className="restaurant-line">
                        <Utensils size={13} />
                        <span>{item.restaurantName}</span>
                      </div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <div className="item-meta">
                        <span><Clock size={14} /> {item.preparationTime} min</span>
                        <span><MapPin size={14} /> {item.categoryName}</span>
                      </div>
                      <div className="explore-card-footer">
                        <div>
                          <strong>Rs. {hasDiscount ? item.discountPrice : item.price}</strong>
                          {hasDiscount && <span>Rs. {item.price}</span>}
                        </div>
                        <button onClick={(event) => handleAddToCart(event, item)}>
                          <ShoppingBag size={16} /> Add
                        </button>
                      </div>
                    </div>
                  </article>
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
