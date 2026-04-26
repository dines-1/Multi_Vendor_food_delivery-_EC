import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart(null);
      setLoading(false);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCart(res.data.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (menuItemId, quantity = 1, special_notes = '') => {
    try {
      const res = await api.post('/cart', { menuItemId, quantity, special_notes });
      setCart(res.data.data);
      toast.success('Added to cart!');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart';
      toast.error(msg);
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      if (quantity > 20) {
        toast.error('Limit of 20 items reached');
        return;
      }
      const res = await api.put(`/cart/${itemId}`, { quantity });
      setCart(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await api.put(`/cart/${itemId}`, { quantity: 0 });
      setCart(res.data.data);
      toast.success('Removed from cart');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCart({ ...cart, items: [], restaurant: null });
    } catch (err) {
      toast.error('Failed to clear cart');
    }
  };

  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const cartTotal = cart?.items?.reduce((acc, item) => {
    const price = item.menuItem?.discountPrice || item.menuItem?.price || 0;
    return acc + (price * item.quantity);
  }, 0) || 0;

  return (
    <CartContext.Provider value={{ 
      cart, 
      loading, 
      addToCart, 
      updateQuantity, 
      removeFromCart, 
      clearCart, 
      cartCount, 
      cartTotal,
      fetchCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
