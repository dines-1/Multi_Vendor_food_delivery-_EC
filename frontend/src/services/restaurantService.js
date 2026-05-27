import api from './api';

const API_URL = '/restaurants';

const restaurantService = {
  getRestaurants: async (params = {}) => {
    const response = await api.get(API_URL, { params });
    return response.data;
  },

  getCuisines: async () => {
    const response = await api.get(`${API_URL}/cuisines`);
    return response.data;
  },

  getRestaurant: async (id) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  }
};

export default restaurantService;
