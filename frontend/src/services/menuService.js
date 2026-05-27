import api from './api';

const API_URL = '/menu';

const menuService = {
  getMenuItems: async (params = {}) => {
    const response = await api.get(API_URL, { params });
    return response.data;
  },

  getMenuItem: async (id) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  }
};

export default menuService;
