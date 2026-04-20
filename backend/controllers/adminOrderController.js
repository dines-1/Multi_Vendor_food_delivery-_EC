import Order from '../models/Order.js';

// @desc    Get all orders with filters
// @route   GET /api/admin/orders
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', restaurant = '', paymentMethod = '', dateFrom = '', dateTo = '' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (restaurant) query.restaurant = restaurant;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (dateFrom || dateTo) {
      query.ordered_at = {};
      if (dateFrom) query.ordered_at.$gte = new Date(dateFrom);
      if (dateTo) query.ordered_at.$lte = new Date(dateTo);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'customer', select: 'name email' },
        { path: 'restaurant', select: 'name' },
      ],
      sort: { ordered_at: -1 },
    };

    const orders = await Order.paginate(query, options);
    res.json({ success: true, data: orders.docs, pagination: { total: orders.totalDocs, page: orders.page, pages: orders.totalPages } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order detail with timeline
// @route   GET /api/admin/orders/:id
export const getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name phone')
      .populate('statusHistory.changedBy', 'name')
      .populate('dispute.resolvedBy', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Override order status
// @route   PUT /api/admin/orders/:id/status
export const overrideStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    order.statusHistory.push({
      status,
      changedBy: req.user._id,
      timestamp: new Date(),
      note: note || 'Admin override',
    });
    if (status === 'delivered') order.delivered_at = new Date();
    await order.save();

    res.json({ success: true, data: order, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Handle refund
// @route   PUT /api/admin/orders/:id/refund
export const handleRefund = async (req, res) => {
  try {
    const { action, amount } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.refundStatus = action === 'approve' ? 'approved' : 'rejected';
    if (action === 'approve') order.refundAmount = amount || order.total_amount;
    await order.save();

    res.json({ success: true, data: order, message: `Refund ${action}d` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export orders as CSV
// @route   GET /api/admin/orders/export
export const exportOrdersCSV = async (req, res) => {
  try {
    const { Parser } = await import('json2csv');
    const orders = await Order.find()
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .lean();

    const flat = orders.map(o => ({
      orderNumber: o.orderNumber,
      customer: o.customer?.name,
      restaurant: o.restaurant?.name,
      total: o.total_amount,
      status: o.status,
      paymentMethod: o.paymentMethod,
      date: o.ordered_at,
    }));

    const parser = new Parser({ fields: Object.keys(flat[0] || {}) });
    const csv = parser.parse(flat);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DISPUTES (embedded in Order.dispute) ====================

export const getDisputes = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const query = { 'dispute.isDisputed': true };
    if (status) query['dispute.status'] = status;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'customer', select: 'name email' },
        { path: 'restaurant', select: 'name' },
      ],
      sort: { createdAt: -1 },
    };

    const orders = await Order.paginate(query, options);
    res.json({ success: true, data: orders.docs, pagination: { total: orders.totalDocs, page: orders.page, pages: orders.totalPages } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDisputeDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .populate('dispute.resolvedBy', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveDispute = async (req, res) => {
  try {
    const { resolution } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.dispute.resolution = resolution;
    order.dispute.status = 'resolved';
    order.dispute.resolvedBy = req.user._id;
    await order.save();

    res.json({ success: true, data: order, message: 'Dispute resolved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
