import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, ClipboardList, Wallet, User } from 'lucide-react';
import './DeliveryLayout.css';

const DeliveryLayout = () => {
  return (
    <div className="delivery-app-frame">
      <main className="delivery-content">
        <Outlet />
      </main>
      
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
