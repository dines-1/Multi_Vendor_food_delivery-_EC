import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import HomeRedirect from './components/HomeRedirect';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import RestaurantDetail from './pages/RestaurantDetail';
import FoodDetail from './pages/FoodDetail';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import VendorManagement from './pages/admin/VendorManagement';
import UserManagement from './pages/admin/UserManagement';
import ProductModeration from './pages/admin/ProductModeration';
import OrderManagement from './pages/admin/OrderManagement';
import FinanceManager from './pages/admin/FinanceManager';
import PlatformSettings from './pages/admin/PlatformSettings';
import MyOrders from './pages/MyOrders';
import TrackOrder from './pages/TrackOrder';
import Explore from './pages/Explore';
import Contact from './pages/Contact';
import AboutUs from './pages/AboutUs';
import AdminRoute from './components/AdminRoute';
import VendorRoute from './components/VendorRoute';
import VendorLayout from './pages/vendor/VendorLayout';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorMenu from './pages/vendor/VendorMenu';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorRevenue from './pages/vendor/VendorRevenue';
import VendorProfile from './pages/vendor/VendorProfile';
import NotFound from './pages/NotFound';
import Orders from './pages/Orders';

import { CartProvider } from './context/CartContext';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentResult from './pages/PaymentResult';
import Registerrestaurants from './pages/Registerrestaurant'

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="app">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '12px',
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
            <Routes>
              {/* Public Routes with Navbar and Footer */}
              <Route path="/" element={<><Navbar /><main className="main-content"><HomeRedirect /></main><Footer /></>} />
              <Route path="/explore" element={<><Navbar /><main className="main-content"><Explore /></main><Footer /></>} />
              <Route path="/about" element={<><Navbar /><main className="main-content"><AboutUs /></main><Footer /></>} />
              <Route path="/contact" element={<><Navbar /><main className="main-content"><Contact /></main><Footer /></>} />
              <Route path="/profile" element={<><Navbar /><main className="main-content"><Profile /></main><Footer /></>} />
              <Route path="/login" element={<><Navbar /><main className="main-content"><Login /></main><Footer /></>} />
              <Route path="/register" element={<><Navbar /><main className="main-content"><Register /></main><Footer /></>} />
              <Route path="//register-restaurant" element={<><Navbar /><main className="main-content"><Registerrestaurants /></main><Footer /></>} />
              <Route path="/restaurant/:id" element={<><Navbar /><main className="main-content"><RestaurantDetail /></main><Footer /></>} />
              <Route path="/food/:id" element={<><Navbar /><main className="main-content"><FoodDetail /></main><Footer /></>} />
              <Route path="/orders" element={<><Navbar /><main className="main-content"><MyOrders /></main><Footer /></>} />
              <Route path="/track-order/:id" element={<><Navbar /><main className="main-content"><TrackOrder /></main><Footer /></>} />
              <Route path="/cart" element={<><Navbar /><main className="main-content"><Cart /></main><Footer /></>} />
              <Route path="/checkout" element={<><Navbar /><main className="main-content"><Checkout /></main><Footer /></>} />
              <Route path="/payment-result" element={<><Navbar /><main className="main-content"><PaymentResult /></main><Footer /></>} />


              {/* Legacy redirect so old links still work */}
              <Route path="/payment-success/:method" element={<><Navbar /><main className="main-content"><PaymentResult /></main><Footer /></>} />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="vendors" element={<VendorManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="products" element={<ProductModeration />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="finance" element={<FinanceManager />} />
                <Route path="settings" element={<PlatformSettings />} />
              </Route>



              {/* Vendor/Restaurant Routes */}
              <Route
                path="/vendor"
                element={
                  <VendorRoute>
                    <VendorLayout />
                  </VendorRoute>
                }
              >
                <Route index element={<VendorDashboard />} />
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="menu" element={<VendorMenu />} />
                <Route path="orders" element={<VendorOrders />} />
                <Route path="revenue" element={<VendorRevenue />} />
                <Route path="profile" element={<VendorProfile />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<><Navbar /><NotFound /><Footer /></>} />

            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
