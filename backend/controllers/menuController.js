import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';

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
// @desc    Get current vendor's menu items
// @route   GET /api/menu/vendor/my-menu
// @access  Private (Vendor)
export const getVendorMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const menuItems = await MenuItem.find({ restaurant: restaurant._id }).populate('category');
    res.status(200).json({ success: true, data: menuItems });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Create menu item (Vendor)
// @route   POST /api/menu/vendor
// @access  Private (Vendor)
export const createMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Create a restaurant profile first' });
    }

    const data = { ...req.body };
    data.restaurant = restaurant._id;
    
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    const menuItem = await MenuItem.create(data);

    res.status(201).json({ success: true, data: menuItem });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update menu item (Vendor)
// @route   PUT /api/menu/vendor/:id
// @access  Private (Vendor)
export const updateMenuItem = async (req, res) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Check ownership
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (menuItem.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this item' });
    }

    const data = { ...req.body };
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    menuItem = await MenuItem.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: menuItem });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete menu item (Vendor)
// @route   DELETE /api/menu/vendor/:id
// @access  Private (Vendor)
export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Check ownership
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (menuItem.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this item' });
    }

    await menuItem.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
