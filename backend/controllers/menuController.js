import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';

// @desc    Get all menu items (Browsing & Search)
// @route   GET /api/menu
// @access  Public
export const getMenuItems = async (req, res) => {
  try {
    const { search, category, restaurant, sort, page = 1, limit = 10 } = req.query;

    const query = { isAvailable: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;
    if (restaurant) query.restaurant = restaurant;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sort || '-createdAt',
      populate: ['category', 'restaurant']
    };

    const menuItems = await MenuItem.paginate(query, options);

    res.status(200).json({ success: true, ...menuItems });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get single menu item (Details)
// @route   GET /api/menu/:id
// @access  Public (tracked for logged in users)
export const getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate(['category', 'restaurant']);

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'MenuItem not found' });
    }

    // Logic for recently viewed if user is logged in
    // This will be handled by a specific middleware or in the controller if user is found
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { recentlyViewed: menuItem._id }
      });
      await User.findByIdAndUpdate(req.user.id, {
        $push: { recentlyViewed: { $each: [menuItem._id], $position: 0, $slice: 10 } }
      });
    }

    res.status(200).json({ success: true, data: menuItem });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get recently viewed items
// @route   GET /api/menu/recently-viewed
// @access  Private
export const getRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'recentlyViewed',
      populate: ['category', 'restaurant']
    });

    res.status(200).json({
      success: true,
      data: user.recentlyViewed
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
