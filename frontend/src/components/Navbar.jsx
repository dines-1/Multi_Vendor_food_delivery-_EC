import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, UtensilsCrossed, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ChatDrawer from './ChatDrawer';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
              <UtensilsCrossed size={24} color="#FFF" />
            </div>
            <span>FoodHub</span>
          </Link>

          <div className="nav-links">
            <Link to="/explore" className="nav-link">Explore</Link>
            <Link to="/restaurants" className="nav-link">Restaurants</Link>
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                <button className="action-btn chat-nav-btn" onClick={() => setShowChat(true)} title="Messages">
                  <MessageCircle size={20} />
                </button>
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
                    {user.role === 'customer' && <Link to="/orders">My Orders</Link>}
                    {user.role === 'delivery' && (
                      <>
                        <Link to="/delivery/dashboard">Dashboard</Link>
                        <Link to="/delivery/orders">Active Orders</Link>
                      </>
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

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
    </>
  );
};

export default Navbar;
