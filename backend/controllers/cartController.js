import Cart from '../models/Cart.js';
import MenuItem from '../models/MenuItem.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.menuItem',
      populate: ['category', 'restaurant']
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { menuItemId, quantity, special_notes } = req.body;

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ menuItem: menuItemId, quantity, special_notes }],
        restaurant: menuItem.restaurant
      });
    } else {
      // Check if item from same restaurant
      if (cart.items.length > 0 && cart.restaurant.toString() !== menuItem.restaurant.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add items from a different restaurant to the same cart. Clear cart first.'
        });
      }

      // Check if item already in cart
      const itemIndex = cart.items.findIndex(item => item.menuItem.toString() === menuItemId);

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += (quantity || 1);
        cart.items[itemIndex].special_notes = special_notes || cart.items[itemIndex].special_notes;
      } else {
        cart.items.push({ menuItem: menuItemId, quantity: quantity || 1, special_notes });
      }
      
      cart.restaurant = menuItem.restaurant;
      await cart.save();
    }

    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update cart item
// @route   PUT /api/cart/:itemId
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { quantity, special_notes } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (quantity !== undefined) item.quantity = quantity;
    if (special_notes !== undefined) item.special_notes = special_notes;

    if (item.quantity <= 0) {
      item.remove();
    }

    await cart.save();

    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      cart.restaurant = null;
      await cart.save();
    }

    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
