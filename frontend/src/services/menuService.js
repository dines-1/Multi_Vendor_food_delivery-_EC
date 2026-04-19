import axios from 'axios';

const API_URL = 'http://localhost:5000/api/menu';

const menuService = {
  getMenuItems: async (params = {}) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
  },

  getMenuItem: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, { withCredentials: true });
    return response.data;
  }
};

export default menuService;
