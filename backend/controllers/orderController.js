import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';

// @desc    Checkout and create order
// @route   POST /api/orders/checkout
// @access  Private
export const checkout = async (req, res) => {
  try {
    const { paymentMethod, delivery_address, delivery_fee } = req.body;

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.menuItem');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = cart.items.map(item => {
      const itemSubtotal = (item.menuItem.discountPrice || item.menuItem.price) * item.quantity;
      subtotal += itemSubtotal;
      return {
        menuItem: item.menuItem._id,
        name: item.menuItem.name,
        unit_price: item.menuItem.discountPrice || item.menuItem.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        special_notes: item.special_notes
      };
    });

    const total_amount = subtotal + (delivery_fee || 0);

    const orderNumber = await Order.generateOrderNumber();

    const order = await Order.create({
      customer: req.user.id,
      restaurant: cart.restaurant,
      orderNumber,
      items: orderItems,
      subtotal,
      delivery_fee: delivery_fee || 0,
      total_amount,
      paymentMethod,
      delivery_address: delivery_address || req.user.address,
      status: 'pending'
    });

    // Clear cart after successful order creation
    cart.items = [];
    cart.restaurant = null;
    await cart.save();

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get user orders (Tracking)
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .sort('-createdAt')
      .populate('restaurant', 'name logo_url');

    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update order status (For Admin/Vendor/Delivery)
// @route   PUT /api/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check
    if (req.user.role === 'vendor') {
      const restaurant = await Restaurant.findOne({ owner: req.user.id });
      if (order.restaurant.toString() !== restaurant._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update status for this restaurant' });
      }
    }
    
    order.status = status;
    if (status === 'delivered') {
      order.delivered_at = Date.now();
    }
    
    await order.save();

    // Emit socket event for real-time status update
    if (global.io) {
      global.io.to(`order_${order._id}`).emit('status-updated', {
        orderId: order._id,
        status: order.status
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get all orders for vendor's restaurant
// @route   GET /api/orders/vendor/my-orders
// @access  Private (Vendor)
export const getVendorOrders = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .sort('-createdAt')
      .populate('customer', 'name phone');

    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Reorder
// @route   POST /api/orders/:id/reorder
// @access  Private
export const reorder = async (req, res) => {
  try {
    const oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) {
      return res.status(404).json({ success: false, message: 'Original order not found' });
    }

    // Clear cart and add original items to cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    cart.items = oldOrder.items.map(item => ({
      menuItem: item.menuItem,
      quantity: item.quantity,
      special_notes: item.special_notes
    }));
    cart.restaurant = oldOrder.restaurant;
    
    await cart.save();

    res.status(200).json({ success: true, message: 'Items added to cart for reorder', data: cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
