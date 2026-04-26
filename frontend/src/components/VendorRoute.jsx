import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VendorRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Authenticating...</div>;
  }

  if (!user || user.role !== 'vendor') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default VendorRoute;
