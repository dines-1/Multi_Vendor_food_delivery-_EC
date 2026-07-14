import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, ShoppingCart, LogOut, UtensilsCrossed, Package, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery'];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadActiveOrders = async () => {
      if (!user || user.role !== 'customer') {
        setActiveOrderCount(0);
        return;
      }

      try {
        const res = await api.get('/orders/my-orders');
        const orders = res.data.data || [];
        const count = orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)).length;
        if (mounted) setActiveOrderCount(count);
      } catch {
        if (mounted) setActiveOrderCount(0);
      }
    };

    loadActiveOrders();
    const interval = setInterval(loadActiveOrders, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    setShowProfile(false);
    logout();
    navigate('/login');
  };

  const userAddress = [
    user?.address?.street,
    user?.address?.area,
    user?.address?.city,
  ].filter(Boolean).join(', ');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <UtensilsCrossed size={24} color="#FFF" />
          </div>
          <span>Chulo</span>
        </Link>

        <div className="nav-links">
          <Link to="/explore" className="nav-link">Explore</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <NotificationBell />
              {user.role === 'customer' && (
                <Link to="/orders?tab=live" className="action-btn orders-nav-btn" title="My Orders">
                  <Package size={20} />
                  {activeOrderCount > 0 && <span className="cart-badge">{activeOrderCount}</span>}
                </Link>
              )}
              {user.role === 'delivery' && (
                <Link to="/delivery/dashboard" className="action-btn orders-nav-btn" title="Delivery Dashboard">
                  <Bike size={20} />
                </Link>
              )}
              {user.role === 'customer' && (
                <Link to="/cart" className="action-btn cart-btn">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
              )}
              <div className="user-profile">
                <div className="avatar-mini">
                  {user.name.charAt(0)}
                </div>
                <div className="profile-dropdown">
                  <button type="button" className="profile-menu-btn" onClick={() => setShowProfile(true)}>
                    My Profile
                  </button>
                  {user.role === 'customer' && (
                    <Link to="/orders?tab=live" className="dropdown-with-badge">
                      <span>My Orders</span>
                      {activeOrderCount > 0 && <span className="dropdown-badge">{activeOrderCount}</span>}
                    </Link>
                  )}

                  {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
                  {user.role === 'vendor' && <Link to="/vendor">Vendor Dashboard</Link>}
                  {user.role === 'delivery' && <Link to="/delivery">Delivery Dashboard</Link>}
                  <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
              {showProfile && (
                <div className="profile-modal-backdrop" onClick={() => setShowProfile(false)}>
                  <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="profile-modal-header">
                      <div className="profile-modal-avatar">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h2>{user.name || 'User'}</h2>
                        <span>{user.role || 'customer'}</span>
                      </div>
                      <button type="button" className="profile-modal-close" onClick={() => setShowProfile(false)}>
                        <X size={18} />
                      </button>
                    </div>

                    <div className="profile-detail-list">
                      <div className="profile-detail-row">
                        <span>Email</span>
                        <strong>{user.email || '-'}</strong>
                      </div>
                      <div className="profile-detail-row">
                        <span>Phone</span>
                        <strong>{user.phone || '-'}</strong>
                      </div>
                      <div className="profile-detail-row">
                        <span>Address</span>
                        <strong>{userAddress || '-'}</strong>
                      </div>
                      <div className="profile-detail-row">
                        <span>Account type</span>
                        <strong>{user.role || 'customer'}</strong>
                      </div>
                    </div>

                    <div className="profile-modal-actions">
                      {user.role === 'admin' && <button type="button" onClick={() => { setShowProfile(false); navigate('/admin'); }}>Admin Panel</button>}
                      {user.role === 'vendor' && <button type="button" onClick={() => { setShowProfile(false); navigate('/vendor'); }}>Vendor Dashboard</button>}
                      {user.role === 'delivery' && <button type="button" onClick={() => { setShowProfile(false); navigate('/delivery'); }}>Delivery Dashboard</button>}
                      {user.role === 'customer' && <button type="button" onClick={() => { setShowProfile(false); navigate('/orders?tab=live'); }}>My Orders</button>}
                      <button type="button" className="profile-modal-logout" onClick={handleLogout}>Logout</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="login-link">Login</Link>
              <Link to="/register" className="register-btn">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
