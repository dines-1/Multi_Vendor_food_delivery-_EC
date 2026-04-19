import axios from 'axios';

const API_URL = 'http://localhost:5000/api/restaurants';

const restaurantService = {
  getRestaurants: async (params = {}) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
  },

  getCuisines: async () => {
    const response = await axios.get(`${API_URL}/cuisines`);
    return response.data;
  },

  getRestaurant: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  }
};

export default restaurantService;
