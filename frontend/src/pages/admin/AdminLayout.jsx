import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, Users, Package, ShoppingCart,
  DollarSign, Settings, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const navItems = [
  { section: 'Main' },
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { section: 'Management' },
  { to: '/admin/vendors', icon: Store, label: 'Vendors' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { section: 'Finance' },
  { to: '/admin/finance', icon: DollarSign, label: 'Finance' },
  { section: 'System' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span>FoodDash</span> Admin
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="sidebar-section">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <item.icon />
                {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div style={{ padding: '0.75rem' }}>
          <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', color: '#94a3b8' }}>
            <LogOut /> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Admin Panel <ChevronRight size={12} style={{ verticalAlign: 'middle' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700
            }}>
              {user?.name?.charAt(0) || 'A'}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.name || 'Admin'}</span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
