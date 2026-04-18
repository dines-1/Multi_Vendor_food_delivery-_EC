import Wishlist from '../models/Wishlist.js';

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: 'items',
      populate: ['category', 'restaurant']
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, items: [] });
    }

    res.status(200).json({ success: true, data: wishlist });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Toggle item in wishlist
// @route   POST /api/wishlist/toggle
// @access  Private
export const toggleWishlist = async (req, res) => {
  try {
    const { menuItemId } = req.body;

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, items: [menuItemId] });
    } else {
      const index = wishlist.items.indexOf(menuItemId);
      if (index > -1) {
        wishlist.items.splice(index, 1);
      } else {
        wishlist.items.push(menuItemId);
      }
      await wishlist.save();
    }

    res.status(200).json({ success: true, data: wishlist });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
