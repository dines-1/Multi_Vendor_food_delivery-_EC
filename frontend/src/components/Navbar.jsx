import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
          <span>FoodHub</span>
        </Link>

        <div className="nav-links">
          <Link to="/explore" className="nav-link">Explore</Link>
          <Link to="/restaurants" className="nav-link">Restaurants</Link>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/cart" className="action-btn cart-btn">
                <ShoppingCart size={20} />
                <span className="cart-badge">2</span>
              </Link>
              <div className="user-profile">
                <div className="avatar-mini">
                  {user.name.charAt(0)}
                </div>
                <div className="profile-dropdown">
                  <Link to="/profile">My Profile</Link>
                  <Link to="/orders">My Orders</Link>
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
