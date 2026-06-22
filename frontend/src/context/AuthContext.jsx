import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      if (!user) {
        fetchUser();
      } else {
        setLoading(false);
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch (err) {
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    setToken(newToken);
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);