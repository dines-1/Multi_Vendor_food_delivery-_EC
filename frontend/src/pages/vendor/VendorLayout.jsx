import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  ShoppingCart,
  User,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import './vendor-theme.css';
import './VendorLayout.css';

const navItems = [
  { to: '/vendor', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/vendor/menu', icon: Utensils, label: 'My Menu' },
  { to: '/vendor/orders', icon: ShoppingCart, label: 'Orders & Revenue' },
  { to: '/vendor/profile', icon: User, label: 'Restaurant Info' },
];

const VendorLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="vp-scope vp-shell">
      <aside className="vp-sidebar">
        <div className="vp-brand">
          <span>Chulo</span> Restaurant
        </div>
        <nav className="vp-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="vp-nav-section">
                {item.section}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `vp-nav-item${isActive ? ' active' : ''}`}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="vp-sidebar-footer">
          <button onClick={handleLogout} className="vp-logout-btn">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="vp-main">
        <header className="vp-topbar">
          <div className="vp-breadcrumb">
            Vendor Center <ChevronRight size={12} />
          </div>
          <div className="vp-topbar-right">
            <NotificationBell variant="vendor" />
            <div className="vp-avatar">{user?.name?.charAt(0) || 'R'}</div>
            <span className="vp-user-name">{user?.name}</span>
          </div>
        </header>
        <div className="vp-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default VendorLayout;