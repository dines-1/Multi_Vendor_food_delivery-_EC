import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Utensils, 
  Users, 
  Truck, 
  Settings, 
  LogOut,
  Bell
} from 'lucide-react';
import './Admin.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          FoodDash Admin
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LayoutDashboard /> Dashboard
          </NavLink>
          <NavLink to="/admin/restaurants" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Utensils /> Restaurants
          </NavLink>
          <NavLink to="/admin/customers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Users /> Customers
          </NavLink>
          <NavLink to="/admin/delivery" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Truck /> Delivery Partners
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Settings /> Settings
          </NavLink>
        </nav>
        <div className="sidebar-footer" style={{ padding: '1rem' }}>
          <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <LogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-breadcrumb">
            <span style={{ color: '#64748b' }}>Pages /</span> Dashboard
          </div>
          <div className="admin-user-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="search-bar" style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search..." 
                style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white' }} 
              />
            </div>
            <Bell size={20} style={{ color: '#64748b', cursor: 'pointer' }} />
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                AD
              </div>
              <div className="user-info">
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Admin User</div>
              </div>
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
