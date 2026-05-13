import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';

// Valid status transitions
const VENDOR_STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: []
};

const DELIVERY_STATUS_FLOW = {
  out_for_delivery: ['delivered'],
};

// @desc    Checkout and create order
// @route   POST /api/orders/checkout
// @access  Private
export const checkout = async (req, res) => {
  try {
    const { paymentMethod, delivery_address, delivery_fee } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.menuItem');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = cart.items.map(item => {
      const price = item.menuItem.discountPrice || item.menuItem.price;
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;
      return {
        menuItem: item.menuItem._id,
        name: item.menuItem.name,
        unit_price: price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        special_notes: item.special_notes
      };
    });

    const feeAmount = delivery_fee || 50;
    const total_amount = subtotal + feeAmount;

    const orderNumber = await Order.generateOrderNumber();

    const order = await Order.create({
      customer: req.user.id,
      restaurant: cart.restaurant,
      orderNumber,
      items: orderItems,
      subtotal,
      delivery_fee: feeAmount,
      total_amount,
      paymentMethod,
      delivery_address,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        changedBy: req.user.id,
        note: 'Order placed by customer'
      }]
    });

    // Clear cart after order
    cart.items = [];
    cart.restaurant = null;
    await cart.save();

    // Notify vendor via socket
    if (global.io) {
      const restaurant = await Restaurant.findById(order.restaurant);
      if (restaurant) {
        global.io.to(`vendor_${restaurant.owner}`).emit('new-order', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          total_amount: order.total_amount
        });
      }
    }

    const populated = await Order.findById(order._id)
      .populate('customer', 'name phone email')
      .populate('restaurant', 'name logo_url');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get customer orders
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

// @desc    Get a single order detail (for customer tracking)
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('restaurant', 'name logo_url address phone')
      .populate('delivery_person_id', 'name phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Customers can only see their own orders; vendors/admin can see any
    if (
      req.user.role === 'customer' &&
      order.customer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update order status (vendor / delivery / admin)
// @route   PUT /api/orders/:id/status
// @access  Private (vendor | delivery | admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // ── Role-based authorization ──────────────────────────────────────
    if (req.user.role === 'vendor') {
      const restaurant = await Restaurant.findOne({ owner: req.user.id });
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found for this vendor' });
      }
      if (order.restaurant.toString() !== restaurant._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized for this order' });
      }
      const allowed = VENDOR_STATUS_FLOW[order.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot move order from "${order.status}" to "${status}"`
        });
      }
    } else if (req.user.role === 'delivery') {
      const allowed = DELIVERY_STATUS_FLOW[order.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Delivery personnel cannot move order from "${order.status}" to "${status}"`
        });
      }
    }
    // admin can do anything

    const previousStatus = order.status;
    order.status = status;

    if (status === 'delivered') {
      order.delivered_at = Date.now();
    }

    // Push to history
    order.statusHistory.push({
      status,
      changedBy: req.user.id,
      note: note || `Status changed from ${previousStatus} to ${status}`
    });

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('customer', 'name phone email')
      .populate('restaurant', 'name logo_url');

    // Real-time update via socket
    if (global.io) {
      global.io.to(`order_${order._id}`).emit('status-updated', {
        orderId: order._id,
        status: order.status,
        statusHistory: order.statusHistory
      });
      // Notify the customer
      global.io.to(`user_${order.customer}`).emit('order-status-changed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      });
    }

    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get all orders for vendor's restaurant (with pagination & filters)
// @route   GET /api/orders/vendor/my-orders
// @access  Private (vendor)
export const getVendorOrders = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const { status, page = 1, limit = 50 } = req.query;
    const filter = { restaurant: restaurant._id };
    if (status && status !== 'all') filter.status = status;

    const orders = await Order.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('customer', 'name phone email');

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Accept order (vendor shortcut)
// @route   POST /api/orders/:id/accept
// @access  Private (vendor)
export const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be accepted' });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant || order.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      changedBy: req.user.id,
      note: 'Order accepted by restaurant'
    });
    await order.save();

    if (global.io) {
      global.io.to(`order_${order._id}`).emit('status-updated', { orderId: order._id, status: 'confirmed' });
      global.io.to(`user_${order.customer}`).emit('order-status-changed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: 'confirmed'
      });
    }

    const populated = await Order.findById(order._id).populate('customer', 'name phone');
    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Reject / cancel order (vendor shortcut)
// @route   POST /api/orders/:id/reject
// @access  Private (vendor)
export const rejectOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be rejected at this stage' });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant || order.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user.id,
      note: reason || 'Order rejected by restaurant'
    });
    await order.save();

    if (global.io) {
      global.io.to(`order_${order._id}`).emit('status-updated', { orderId: order._id, status: 'cancelled' });
      global.io.to(`user_${order.customer}`).emit('order-status-changed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: 'cancelled'
      });
    }

    const populated = await Order.findById(order._id).populate('customer', 'name phone');
    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Cancel order (customer)
// @route   POST /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Only customer who owns it or admin
    if (req.user.role === 'customer' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user.id,
      note: 'Cancelled by customer'
    });
    await order.save();

    if (global.io) {
      global.io.to(`order_${order._id}`).emit('status-updated', { orderId: order._id, status: 'cancelled' });
    }

    res.status(200).json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Reorder – copy old order items to cart
// @route   POST /api/orders/:id/reorder
// @access  Private
export const reorder = async (req, res) => {
  try {
    const oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) return res.status(404).json({ success: false, message: 'Original order not found' });
    if (oldOrder.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

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

// @desc    Get vendor revenue stats
// @route   GET /api/orders/vendor/revenue
// @access  Private (vendor)
export const getVendorRevenue = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    const completedOrders = await Order.find({ restaurant: restaurant._id, status: 'delivered' });
    const totalEarnings = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalOrders = completedOrders.length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Order.aggregate([
      { $match: { restaurant: restaurant._id, status: 'delivered', createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$subtotal' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: { totalEarnings, totalOrders, dailyRevenue, restaurantBalance: restaurant.earnings || 0 }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
