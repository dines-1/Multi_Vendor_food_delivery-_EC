import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, 
  Utensils, 
  ShoppingCart, 
  User, 
  LogOut, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './VendorLayout.css';

const navItems = [
  { section: 'Dashboard' },
  { to: '/vendor', icon: LayoutDashboard, label: 'Overview', end: true },
  { section: 'Operation' },
  { to: '/vendor/menu', icon: Utensils, label: 'My Menu' },
  { to: '/vendor/orders', icon: ShoppingCart, label: 'Manage Orders' },
  { section: 'Analytics' },
  { to: '/vendor/revenue', icon: TrendingUp, label: 'Revenue' },
  { section: 'Profile' },
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
    <div className="admin-layout">
      <aside className="admin-sidebar" style={{ background: '#131110' }}>
        <div className="sidebar-header" style={{ color: '#fff' }}>
          <span style={{ color: '#FF5C1A' }}>FD</span> Restaurant
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="sidebar-section" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                {item.section}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                style={({ isActive }) => ({
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    background: isActive ? '#FF5C1A' : 'transparent'
                })}
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div style={{ padding: '0.75rem', marginTop: 'auto' }}>
          <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
            Vendor Center <ChevronRight size={12} style={{ verticalAlign: 'middle' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '12px',
              background: '#FF5C1A',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 800
            }}>
              {user?.name?.charAt(0) || 'R'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#131110' }}>{user?.name}</span>
                <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Restaurant Manager</span>
            </div>
          </div>
        </header>
        <div style={{ padding: '40px' }}>
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default VendorLayout;
