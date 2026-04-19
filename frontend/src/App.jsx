import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDelivery from './pages/admin/AdminDelivery';
import MyOrders from './pages/MyOrders';
import TrackOrder from './pages/TrackOrder';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryOrders from './pages/delivery/DeliveryOrders';
import AdminRoute from './components/AdminRoute';
import DeliveryRoute from './components/DeliveryRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
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
            <Route path="/" element={<><Navbar /><main className="main-content"><Home /></main><Footer /></>} />
            <Route path="/login" element={<><Navbar /><main className="main-content"><Login /></main><Footer /></>} />
            <Route path="/register" element={<><Navbar /><main className="main-content"><Register /></main><Footer /></>} />
            <Route path="/orders" element={<><Navbar /><main className="main-content"><MyOrders /></main><Footer /></>} />
            <Route path="/track-order/:id" element={<><Navbar /><main className="main-content"><TrackOrder /></main><Footer /></>} />



            {/* Admin Routes with dedicated Layout */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="restaurants" element={<AdminRestaurants />} />
              <Route path="customers" element={<AdminUsers />} />
              <Route path="delivery" element={<AdminDelivery />} />
            </Route>

            {/* Delivery Routes */}
            <Route 
              path="/delivery" 
              element={
                <DeliveryRoute>
                  <><Navbar /><main className="main-content"><DeliveryDashboard /></main></>
                </DeliveryRoute>
              }
            />
            <Route 
              path="/delivery/dashboard" 
              element={
                <DeliveryRoute>
                  <><Navbar /><main className="main-content"><DeliveryDashboard /></main></>
                </DeliveryRoute>
              }
            />
            <Route 
              path="/delivery/orders" 
              element={
                <DeliveryRoute>
                  <><Navbar /><main className="main-content"><DeliveryOrders /></main></>
                </DeliveryRoute>
              }
            />

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
