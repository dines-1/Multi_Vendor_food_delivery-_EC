import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Wallet, User, LogOut, Bike } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './DeliveryLayout.css';

const DeliveryLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="delivery-app-frame">
      {/* Sidebar for Desktop */}
      <aside className="delivery-sidebar">
        <div className="sidebar-logo">
          <Bike size={32} />
          <span>FastFood Delivery</span>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/delivery/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Home size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/delivery/history" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ClipboardList size={20} />
            <span>Deliveries</span>
          </NavLink>
          <NavLink to="/delivery/earnings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Wallet size={20} />
            <span>Earnings</span>
          </NavLink>
          <NavLink to="/delivery/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <User size={20} />
            <span>My Profile</span>
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="delivery-content">
        <Outlet />
      </main>
      
      {/* Bottom Nav for Mobile */}
      <nav className="delivery-bottom-nav">
        <NavLink to="/delivery/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Home size={24} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/delivery/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ClipboardList size={24} />
          <span>History</span>
        </NavLink>
        <NavLink to="/delivery/earnings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Wallet size={24} />
          <span>Earnings</span>
        </NavLink>
        <NavLink to="/delivery/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <User size={24} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default DeliveryLayout;
