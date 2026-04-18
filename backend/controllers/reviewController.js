import Review from '../models/Review.js';
import Order from '../models/Order.js';

// @desc    Add review
// @route   POST /api/reviews
// @access  Private
export const addReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to review this order' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Can only review delivered orders' });
    }

    const review = await Review.create({
      order: orderId,
      customer: req.user.id,
      restaurant: order.restaurant,
      rating,
      comment
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already reviewed this order' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get reviews for a restaurant
// @route   GET /api/reviews/restaurant/:id
// @access  Public
export const getRestaurantReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.id })
      .populate('customer', 'name avatar')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: reviews });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
