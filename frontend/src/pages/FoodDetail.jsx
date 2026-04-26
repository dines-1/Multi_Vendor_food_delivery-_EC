import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, 
    Heart, 
    Share2, 
    Star, 
    Clock, 
    ShieldCheck, 
    Truck, 
    Minus, 
    Plus,
    ShoppingBag,
    Utensils
} from 'lucide-react';
import menuService from '../services/menuService';
import restaurantService from '../services/restaurantService';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import './FoodDetail.css';

const FoodDetail = () => {
    const { addToCart } = useCart();
    const { id } = useParams();
    const navigate = useNavigate();
    const [food, setFood] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        const fetchFood = async () => {
            try {
                const res = await menuService.getMenuItem(id);
                if (res.success) {
                    setFood(res.data);
                    // Fetch restaurant info
                    if (res.data.restaurant) {
                        const resInfo = await restaurantService.getRestaurant(res.data.restaurant);
                        if (resInfo.success) setRestaurant(resInfo.data);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFood();
    }, [id]);

    const handleAddToCart = () => {
        if (quantity > 20) {
            toast.error('Limit of 20 items reached');
            return;
        }
        addToCart(food._id, quantity);
    };

    if (loading) return <div className="loading-screen">Preparing your meal...</div>;
    if (!food) return <div className="error-screen">Dish not found</div>;

    return (
        <div className="food-detail fade-in">
            <div className="detail-grid">
                {/* Left Side: Images */}
                <div className="detail-images">
                    <button className="back-floating" onClick={() => navigate(-1)}>
                        <ChevronLeft size={24} />
                    </button>
                    
                    <div className="main-image">
                        <img src={food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} alt={food.name} />
                        <div className="discount-tag">15% OFF</div>
                    </div>

                    <div className="thumbnail-track">
                        {[1,2,3].map((_, i) => (
                            <div 
                                key={i} 
                                className={`thumbnail ${activeImage === i ? 'active' : ''}`}
                                onClick={() => setActiveImage(i)}
                            >
                                <img src={food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} alt="thumb" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Details */}
                <div className="detail-content">
                    <div className="content-header">
                        <div className="res-mini-link" onClick={() => navigate(`/restaurant/${restaurant?._id}`)}>
                            <Utensils size={14} />
                            <span>{restaurant?.name || 'Loading restaurant...'}</span>
                        </div>
                        <div className="util-actions">
                            <button className="util-btn"><Heart size={20} /></button>
                            <button className="util-btn"><Share2 size={20} /></button>
                        </div>
                    </div>

                    <h1 className="food-name">{food.name}</h1>
                    
                    <div className="price-rating-row">
                        <div className="price-stack">
                            <span className="price-main">Rs. {food.price}</span>
                            <span className="price-old">Rs. {food.price + 50}</span>
                        </div>
                        <div className="rating-stack">
                            <div className="stars">
                                <Star size={16} fill="#F59E0B" color="#F59E0B" />
                                <strong>4.8</strong>
                                <span>(120+ Reviews)</span>
                            </div>
                        </div>
                    </div>

                    <p className="food-description">{food.description || 'Experience a burst of flavors with our chef\'s special creation. Prepared with fresh ingredients and authentic spices.'}</p>

                    <div className="features-strip">
                        <div className="f-item">
                            <Clock size={16} />
                            <span>20-30 min</span>
                        </div>
                        <div className="f-item">
                            <Truck size={16} />
                            <span>Free Delivery</span>
                        </div>
                        <div className="f-item">
                            <ShieldCheck size={16} />
                            <span>Quality Assured</span>
                        </div>
                    </div>

                    <div className="order-actions">
                        <div className="quantity-selector">
                            <button onClick={() => setQuantity(q => Math.max(1, q-1))}><Minus size={18} /></button>
                            <span>{quantity}</span>
                            <button onClick={() => setQuantity(q => Math.min(20, q+1))}><Plus size={18} /></button>
                        </div>
                        <button className="add-to-cart-btn" onClick={handleAddToCart}>
                            <ShoppingBag size={20} />
                            Add to Cart — Rs. {food.price * quantity}
                        </button>
                    </div>

                    <div className="additional-info">
                        <h3>Ingredients</h3>
                        <div className="ingredients-list">
                            {['Fresh Herbs', 'Organic Spices', 'Premium Oil', 'Chef Secret Sauce'].map(ing => (
                                <span key={ing} className="ing-tag">{ing}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FoodDetail;
