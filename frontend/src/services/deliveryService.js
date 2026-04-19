import axios from 'axios';

const API_URL = 'http://localhost:5000/api/delivery';

const deliveryService = {
  getProfile: async () => {
    const response = await axios.get(`${API_URL}/profile`, { withCredentials: true });
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await axios.put(`${API_URL}/profile`, data, { withCredentials: true });
    return response.data;
  },

  getOrderRequests: async () => {
    const response = await axios.get(`${API_URL}/requests`, { withCredentials: true });
    return response.data;
  },

  getActiveOrders: async () => {
    const response = await axios.get(`${API_URL}/active-orders`, { withCredentials: true });
    return response.data;
  },

  acceptOrder: async (id) => {
    const response = await axios.put(`${API_URL}/orders/${id}/accept`, {}, { withCredentials: true });
    return response.data;
  },

  updateLocation: async (location) => {
    const response = await axios.put(`${API_URL}/location`, location, { withCredentials: true });
    return response.data;
  }
};

export default deliveryService;
