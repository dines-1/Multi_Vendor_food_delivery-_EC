import Cart from '../models/Cart.js';
import MenuItem from '../models/MenuItem.js';

const populateCart = (query) =>
  query.populate({
    path: 'items.menuItem',
    select: 'name price discountPrice image_url restaurant category',
    populate: [
      { path: 'restaurant', select: 'name logo_url' },
      { path: 'category', select: 'name' }
    ]
  }).populate('restaurant', 'name logo_url');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await populateCart(Cart.findOne({ user: req.user.id }));

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
    const { menuItemId, quantity = 1, special_notes } = req.body;

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    if (!menuItem.isAvailable) {
      return res.status(400).json({ success: false, message: 'This item is currently unavailable' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ menuItem: menuItemId, quantity, special_notes }],
        restaurant: menuItem.restaurant
      });
    } else {
      // Enforce single-restaurant cart
      if (
        cart.items.length > 0 &&
        cart.restaurant &&
        cart.restaurant.toString() !== menuItem.restaurant.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add items from a different restaurant. Clear your cart first.',
          code: 'DIFFERENT_RESTAURANT'
        });
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.menuItem.toString() === menuItemId
      );

      if (itemIndex > -1) {
        const newQty = cart.items[itemIndex].quantity + quantity;
        if (newQty > 20) {
          return res.status(400).json({ success: false, message: 'Quantity cannot exceed 20 per item' });
        }
        cart.items[itemIndex].quantity = newQty;
        if (special_notes !== undefined) {
          cart.items[itemIndex].special_notes = special_notes;
        }
      } else {
        if (quantity > 20) {
          return res.status(400).json({ success: false, message: 'Quantity cannot exceed 20 per item' });
        }
        cart.items.push({ menuItem: menuItemId, quantity, special_notes });
      }

      cart.restaurant = menuItem.restaurant;
      await cart.save();
    }

    // Re-fetch with population
    const populated = await populateCart(Cart.findById(cart._id));
    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update cart item quantity / notes
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

    if (quantity !== undefined) {
      if (quantity <= 0) {
        // Remove the item
        cart.items.pull({ _id: req.params.itemId });
        if (cart.items.length === 0) {
          cart.restaurant = null;
        }
        await cart.save();
        const populated = await populateCart(Cart.findById(cart._id));
        return res.status(200).json({ success: true, data: populated });
      }
      if (quantity > 20) {
        return res.status(400).json({ success: false, message: 'Quantity cannot exceed 20' });
      }
      item.quantity = quantity;
    }

    if (special_notes !== undefined) item.special_notes = special_notes;

    await cart.save();

    const populated = await populateCart(Cart.findById(cart._id));
    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Remove a single item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
export const removeCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.items.pull({ _id: req.params.itemId });
    if (cart.items.length === 0) {
      cart.restaurant = null;
    }
    await cart.save();

    const populated = await populateCart(Cart.findById(cart._id));
    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Clear entire cart
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
