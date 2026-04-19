import Restaurant from '../models/Restaurant.js';

// @desc    Get all restaurants (Public)
// @route   GET /api/restaurants
// @access  Public
export const getRestaurants = async (req, res) => {
  try {
    const { cuisine, search, page = 1, limit = 10 } = req.query;

    const query = { status: 'active' };

    if (cuisine) {
      query.cuisines = { $in: [cuisine] };
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { rating: -1, createdAt: -1 },
      populate: 'owner',
    };

    const restaurants = await Restaurant.paginate(query, options);

    res.status(200).json({ success: true, ...restaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all unique cuisines
// @route   GET /api/restaurants/cuisines
// @access  Public
export const getCuisines = async (req, res) => {
  try {
    const cuisines = await Restaurant.distinct('cuisines', { status: 'active' });
    res.status(200).json({ success: true, data: cuisines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single restaurant details
// @route   GET /api/restaurants/:id
// @access  Public
export const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
