import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Star, 
    Clock, 
    MapPin, 
    Phone, 
    Search, 
    ChevronLeft, 
    Heart, 
    Share2,
    Info,
    UtensilsCrossed
} from 'lucide-react';
import restaurantService from '../services/restaurantService';
import menuService from '../services/menuService';
import { useCart } from '../context/CartContext';
import './RestaurantDetail.css';

const RestaurantDetail = () => {
    const { addToCart } = useCart();
    const { id } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');

    const handleAddToCart = (e, foodId) => {
        e.stopPropagation();
        addToCart(foodId, 1);
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const resData = await restaurantService.getRestaurant(id);
                const menuData = await menuService.getMenuItems({ restaurant: id });
                
                if (resData.success) setRestaurant(resData.data);
                if (menuData.success) setMenuItems(menuData.docs);
            } catch (error) {
                console.error('Error fetching restaurant details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return <div className="loading-screen">Loading flavors...</div>;
    if (!restaurant) return <div className="error-screen">Restaurant not found</div>;

    const categories = ['All', ...new Set(menuItems.map(item => item.category))];
    const filteredItems = activeCategory === 'All' 
        ? menuItems 
        : menuItems.filter(item => item.category === activeCategory);

    return (
        <div className="restaurant-detail fade-in">
            {/* Header / Hero */}
            <div className="res-hero">
                <div className="res-hero-image">
                    <img src={restaurant.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'} alt={restaurant.name} />
                    <div className="res-hero-overlay"></div>
                </div>
                
                <div className="res-hero-content">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ChevronLeft size={24} />
                    </button>
                    <div className="res-actions">
                        <button className="action-circle"><Heart size={20} /></button>
                        <button className="action-circle"><Share2 size={20} /></button>
                    </div>
                </div>
            </div>

            <div className="res-main-container">
                {/* Information Section */}
                <div className="res-info-section">
                    <div className="res-status-badge">Available Now</div>
                    <h1 className="res-title">{restaurant.name}</h1>
                    <p className="res-cuisines">{restaurant.cuisines?.join(' • ')}</p>
                    
                    <div className="res-meta-grid">
                        <div className="meta-item">
                            <div className="meta-icon rating"><Star size={18} fill="currentColor" /></div>
                            <div className="meta-text">
                                <span className="val">{restaurant.rating}</span>
                                <span className="lbl">{restaurant.totalReviews || 0} reviews</span>
                            </div>
                        </div>
                        <div className="meta-item">
                            <div className="meta-icon time"><Clock size={18} /></div>
                            <div className="meta-text">
                                <span className="val">25-35 min</span>
                                <span className="lbl">Delivery Time</span>
                            </div>
                        </div>
                        <div className="meta-item">
                            <div className="meta-icon info"><Info size={18} /></div>
                            <div className="meta-text">
                                <span className="val">Open</span>
                                <span className="lbl">{restaurant.openTime} - {restaurant.closeTime}</span>
                            </div>
                        </div>
                    </div>

                    <div className="res-contact-info">
                        <div className="contact-item">
                            <MapPin size={18} />
                            <span>{restaurant.address?.area}, {restaurant.address?.city}</span>
                        </div>
                        <div className="contact-item">
                            <Phone size={18} />
                            <span>{restaurant.phone || 'Contact via App'}</span>
                        </div>
                    </div>
                </div>

                {/* Menu Section */}
                <div className="res-menu-section">
                    <div className="menu-header">
                        <div className="menu-search">
                            <Search size={20} color="#9CA3AF" />
                            <input type="text" placeholder="Search menu items..." />
                        </div>
                        <div className="category-scroll">
                            {categories.map(cat => (
                                <button 
                                    key={cat} 
                                    className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="menu-grid">
                        {filteredItems.map(item => (
                            <div key={item._id} className="menu-item-card" onClick={() => navigate(`/food/${item._id}`)}>
                                <div className="item-image">
                                    <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} alt={item.name} />
                                    <button className="add-item-btn" onClick={(e) => handleAddToCart(e, item._id)}>+</button>
                                </div>
                                <div className="item-details">
                                    <div className="item-header">
                                        <h3>{item.name}</h3>
                                        {item.isVeg && <div className="veg-indicator"></div>}
                                    </div>
                                    <p className="item-desc">{item.description?.substring(0, 60)}...</p>
                                    <div className="item-footer">
                                        <span className="item-price">Rs. {item.price}</span>
                                        <div className="item-rating"><Star size={12} fill="currentColor" /> 4.5</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="empty-menu">
                            <UtensilsCrossed size={48} />
                            <h3>No items found in this category</h3>
                            <p>Try exploring our other delicious options.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestaurantDetail;
