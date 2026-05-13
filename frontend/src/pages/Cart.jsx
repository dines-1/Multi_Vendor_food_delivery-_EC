import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ChevronLeft,
  Store,
  AlertTriangle,
  Loader2,
  PackageOpen
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const DELIVERY_FEE = 50;

  const handleRemove = async (itemId) => {
    setRemovingId(itemId);
    await removeFromCart(itemId);
    setRemovingId(null);
  };

  const handleClear = async () => {
    setClearing(true);
    await clearCart();
    setClearing(false);
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <Loader2 size={40} className="spin" />
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart-page fade-in">
        <div className="empty-content">
          <div className="empty-icon-wrap">
            <PackageOpen size={72} strokeWidth={1.2} />
          </div>
          <h1>Your cart is empty</h1>
          <p>Looks like you haven't added anything yet. Explore our restaurants and find something delicious!</p>
          <Link to="/" className="browse-btn">
            Browse Restaurants <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const grandTotal = cartTotal + DELIVERY_FEE;

  return (
    <div className="cart-page fade-in">
      <div className="cart-container">
        {/* Header */}
        <div className="cart-header">
          <button className="back-link" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} /> Back
          </button>
          <div className="cart-title-area">
            <h1>
              <ShoppingCart size={28} />
              My Cart
              <span className="badge">{cartCount} items</span>
            </h1>
            {cart.restaurant && (
              <div className="restaurant-chip">
                <Store size={14} />
                <span>Ordering from: <strong>{cart.restaurant?.name}</strong></span>
              </div>
            )}
          </div>
          <button className="clear-cart-btn" onClick={handleClear} disabled={clearing}>
            {clearing ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
            Clear All
          </button>
        </div>

        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items-section">
            {cart.items.map((item) => {
              const price = item.menuItem?.discountPrice || item.menuItem?.price || 0;
              const itemTotal = price * item.quantity;
              const isRemoving = removingId === item._id;

              return (
                <div
                  key={item._id}
                  className={`cart-item-card ${isRemoving ? 'removing' : ''}`}
                >
                  <div className="item-img">
                    <img
                      src={item.menuItem?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80'}
                      alt={item.menuItem?.name}
                    />
                  </div>
                  <div className="item-details">
                    <div className="item-meta">
                      <h3 className="item-name">{item.menuItem?.name}</h3>
                      {item.menuItem?.category?.name && (
                        <span className="item-category">{item.menuItem.category.name}</span>
                      )}
                      {item.special_notes && (
                        <p className="item-note">
                          <AlertTriangle size={12} /> {item.special_notes}
                        </p>
                      )}
                    </div>
                    <div className="item-pricing">
                      <span className="unit-price">Rs. {price} each</span>
                      <span className="item-total">Rs. {itemTotal}</span>
                    </div>
                  </div>
                  <div className="item-controls">
                    <div className="qty-selector">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={item.quantity >= 20}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemove(item._id)}
                      disabled={isRemoving}
                      aria-label="Remove item"
                    >
                      {isRemoving ? <Loader2 size={18} className="spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="cart-summary-section">
            <div className="summary-card">
              <h3>Order Summary</h3>

              <div className="summary-rows">
                {cart.items.map((item) => {
                  const price = item.menuItem?.discountPrice || item.menuItem?.price || 0;
                  return (
                    <div key={item._id} className="summary-mini-row">
                      <span>{item.menuItem?.name} × {item.quantity}</span>
                      <span>Rs. {price * item.quantity}</span>
                    </div>
                  );
                })}
              </div>

              <div className="summary-divider" />

              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {cartTotal}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span className="delivery-fee">Rs. {DELIVERY_FEE}</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-row total">
                <span>Total</span>
                <span>Rs. {grandTotal}</span>
              </div>

              <button
                className="checkout-btn"
                onClick={() => navigate('/checkout')}
                id="proceed-checkout-btn"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>

              <p className="secure-text">🔒 Secure & Fast Delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
