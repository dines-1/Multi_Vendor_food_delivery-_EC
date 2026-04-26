import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Banknote, ShieldCheck, ArrowRight, ChevronLeft, Wallet } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Checkout.css';

const Checkout = () => {
  const { cart, cartTotal, cartCount, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [address, setAddress] = useState({
    street: '',
    area: '',
    city: 'Kathmandu'
  });

  if (!cart || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  const deliveryFee = 50;
  const grandTotal = cartTotal + deliveryFee;

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.street || !address.area) {
      toast.error('Please fill in your delivery address');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Order
      const orderRes = await api.post('/orders/checkout', {
        paymentMethod,
        delivery_address: address,
        delivery_fee: deliveryFee
      });

      const order = orderRes.data.data;

      // 2. Handle Payment Redirection
      if (paymentMethod === 'cash') {
        toast.success('Order placed successfully!');
        navigate(`/track-order/${order._id}`);
      } else if (paymentMethod === 'esewa') {
        const esewaRes = await api.post('/payments/esewa/initiate', { orderId: order._id });
        initiateEsewaPayment(esewaRes.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const initiateEsewaPayment = (data) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

    Object.entries(data).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="checkout-page fade-in">
      <div className="checkout-container">
        <div className="checkout-header">
          <button className="back-link" onClick={() => navigate('/cart')}>
            <ChevronLeft size={20} /> Back to Cart
          </button>
          <h1>Checkout Summary</h1>
        </div>

        <div className="checkout-layout">
          <form onSubmit={handleSubmit} className="checkout-main">
            {/* Delivery Section */}
            <div className="checkout-section">
              <div className="section-title">
                <MapPin size={24} />
                <h2>Delivery Address</h2>
              </div>
              <div className="address-form">
                <div className="form-group">
                  <label>Street Address</label>
                  <input 
                    name="street" 
                    placeholder="e.g. House No, Street Name" 
                    value={address.street}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Area / Landmark</label>
                    <input 
                      name="area" 
                      placeholder="e.g. Near New Road" 
                      value={address.area}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input 
                      name="city" 
                      value={address.city}
                      onChange={handleAddressChange}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="checkout-section">
              <div className="section-title">
                <CreditCard size={24} />
                <h2>Payment Method</h2>
              </div>
              <div className="payment-options">
                <div 
                  className={`payment-card ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="pay-icon"><Banknote size={24} /></div>
                  <div className="pay-info">
                    <h4>Cash on Delivery</h4>
                    <p>Pay when you receive</p>
                  </div>
                  <div className="radio-circle"></div>
                </div>

                <div 
                  className={`payment-card ${paymentMethod === 'esewa' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('esewa')}
                >
                  <div className="pay-icon esewa"><Wallet size={24} /></div>
                  <div className="pay-info">
                    <h4>eSewa Digital Wallet</h4>
                    <p>Secure online payment</p>
                  </div>
                  <div className="radio-circle"></div>
                </div>
              </div>
            </div>

            <button type="submit" className="place-order-btn" disabled={loading}>
              {loading ? 'Processing...' : `Place Order (Rs. ${grandTotal})`} <ArrowRight size={20} />
            </button>
          </form>

          {/* Order Summary Side */}
          <div className="checkout-sidebar">
            <div className="order-summary-card">
              <h3>My Order</h3>
              <div className="mini-item-list">
                {cart.items.map(item => (
                  <div key={item._id} className="mini-item">
                    <span className="qty">{item.quantity}x</span>
                    <span className="name">{item.menuItem?.name}</span>
                    <span className="price">Rs. {(item.menuItem?.discountPrice || item.menuItem?.price) * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="summary-divider"></div>
              <div className="summary-calc">
                <div className="row">
                  <span>Subtotal</span>
                  <span>Rs. {cartTotal}</span>
                </div>
                <div className="row">
                  <span>Delivery Fee</span>
                  <span>Rs. {deliveryFee}</span>
                </div>
                <div className="row total">
                  <span>Total</span>
                  <span>Rs. {grandTotal}</span>
                </div>
              </div>
              <div className="secure-badge">
                <ShieldCheck size={20} color="#1DB954" />
                <span>100% Secure Transaction</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
