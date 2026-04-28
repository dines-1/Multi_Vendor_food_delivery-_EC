import api from './api';

const reviewService = {
  submitReview: async (orderId, rating, comment) => {
    const res = await api.post('/reviews', { orderId, rating, comment });
    return res.data;
  },

  getRestaurantReviews: async (restaurantId) => {
    const res = await api.get(`/reviews/restaurant/${restaurantId}`);
    return res.data;
  },
};

export default reviewService;
