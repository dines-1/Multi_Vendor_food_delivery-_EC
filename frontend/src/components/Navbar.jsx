import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, UtensilsCrossed, Package } from 'lucide-react';
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
    logout();
    navigate('/login');
  };

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
                <Link to="/cart" className="action-btn cart-btn">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
                <div className="user-profile">
                  <div className="avatar-mini">
                    {user.name.charAt(0)}
                  </div>
                  <div className="profile-dropdown">
                    <Link to="/profile">My Profile</Link>
                    {user.role === 'customer' && (
                      <Link to="/orders?tab=live" className="dropdown-with-badge">
                        <span>My Orders</span>
                        {activeOrderCount > 0 && <span className="dropdown-badge">{activeOrderCount}</span>}
                      </Link>
                    )}

                    {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
                    <button onClick={handleLogout} className="logout-btn">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
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
