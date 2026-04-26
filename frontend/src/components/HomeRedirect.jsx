import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../pages/Home';

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'vendor') navigate('/vendor');
      else if (user.role === 'delivery') navigate('/delivery/dashboard');
    }
  }, [user, loading, navigate]);

  return <Home />;
};

export default HomeRedirect;
