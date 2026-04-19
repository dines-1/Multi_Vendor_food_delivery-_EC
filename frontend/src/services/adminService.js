import api from './api';

const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getRestaurants: async (page = 1, status = '') => {
    const response = await api.get(`/admin/restaurants?page=${page}&status=${status}`);
    return response.data;
  },

  updateRestaurantStatus: async (id, status) => {
    const response = await api.put(`/admin/restaurants/${id}/status`, { status });
    return response.data;
  },

  getCustomers: async (page = 1) => {
    const response = await api.get(`/admin/customers?page=${page}`);
    return response.data;
  },

  updateUserStatus: async (id, isActive) => {
    const response = await api.put(`/admin/users/${id}/status`, { isActive });
    return response.data;
  },

  getDeliveryPersonnel: async (status = '') => {
    const response = await api.get(`/admin/delivery?status=${status}`);
    return response.data;
  },

  updateDeliveryStatus: async (id, status) => {
    const response = await api.put(`/admin/delivery/${id}/status`, { status });
    return response.data;
  },
};

export default adminService;
