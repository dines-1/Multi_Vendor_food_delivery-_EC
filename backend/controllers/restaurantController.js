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
// @desc    Get current vendor's restaurant details
// @route   GET /api/restaurants/vendor/my-restaurant
// @access  Private (Vendor)
export const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'No restaurant profile found for this vendor' });
    }

    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create or Update restaurant profile (Vendor)
// @route   POST /api/restaurants/vendor/profile
// @access  Private (Vendor)
export const updateVendorProfile = async (req, res) => {
  try {
    let restaurant = await Restaurant.findOne({ owner: req.user.id });
    
    const data = { ...req.body };
    if (req.file) {
      data.logo_url = `/uploads/${req.file.filename}`;
    }

    if (restaurant) {
      // Update
      restaurant = await Restaurant.findOneAndUpdate(
        { owner: req.user.id },
        data,
        { new: true, runValidators: true }
      );
    } else {
      // Create
      data.owner = req.user.id;
      restaurant = await Restaurant.create(data);
    }

    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
