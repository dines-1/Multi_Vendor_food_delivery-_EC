import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ChevronLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cart, loading, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  if (loading) return <div className="loading-screen">Updating your flavors...</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart-page fade-in">
        <div className="empty-content">
          <div className="cart-icon-bg">
            <ShoppingCart size={64} color="#121211" />
          </div>
          <h1>Your cart is empty</h1>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/" className="browse-btn">
            Browse Restaurants <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  const deliveryFee = 50;

  return (
    <div className="cart-page fade-in">
      <div className="cart-container">
        <div className="cart-header">
          <button className="back-link" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} /> Back to browsing
          </button>
          <h1>My Shopping Cart <span className="item-count">({cartCount} items)</span></h1>
        </div>

        <div className="cart-layout">
          {/* Items List */}
          <div className="cart-items-section">
            {cart.items.map((item) => (
              <div key={item._id} className="cart-item-card">
                <div className="item-img">
                  <img src={item.menuItem?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} alt={item.menuItem?.name} />
                </div>
                <div className="item-info">
                  <div className="item-main">
                    <h3>{item.menuItem?.name}</h3>
                    <p className="item-restaurant">{item.menuItem?.restaurant?.name}</p>
                    {item.special_notes && <p className="item-note">Note: {item.special_notes}</p>}
                  </div>
                  <div className="item-price">
                    Rs. {item.menuItem?.discountPrice || item.menuItem?.price}
                  </div>
                </div>
                <div className="item-controls">
                  <div className="qty-selector">
                    <button 
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                    >
                        <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={item.quantity >= 20}
                    >
                        <Plus size={16} />
                    </button>
                  </div>
                  <button className="remove-btn" onClick={() => removeFromCart(item._id)}>
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Sidebar */}
          <div className="cart-summary-section">
            <div className="summary-card">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {cartTotal}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>Rs. {deliveryFee}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>Rs. {cartTotal + deliveryFee}</span>
              </div>
              <button className="checkout-btn" onClick={() => navigate('/checkout')}>
                Proceed to Checkout <ArrowRight size={20} />
              </button>
              <p className="secure-text">Secure Checkout & Fast Delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
