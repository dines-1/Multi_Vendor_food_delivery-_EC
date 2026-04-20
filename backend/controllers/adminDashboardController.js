import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';

// @desc    Get KPI metrics
// @route   GET /api/admin/dashboard/kpi
export const getKPIMetrics = async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'confirmed', 'preparing'] } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]);
    const totalOrders = await Order.countDocuments();
    const activeVendors = await Restaurant.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders,
        activeVendors,
        totalUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get daily revenue for last 30 days
// @route   GET /api/admin/dashboard/revenue-chart
export const getDailyRevenue = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await Order.aggregate([
      { $match: { ordered_at: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$ordered_at' } },
          revenue: { $sum: '$total_amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get orders per day for last 7 days
// @route   GET /api/admin/dashboard/orders-chart
export const getOrdersPerDay = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const data = await Order.aggregate([
      { $match: { ordered_at: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$ordered_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order status breakdown
// @route   GET /api/admin/dashboard/order-status
export const getOrderStatusBreakdown = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recent 10 orders
// @route   GET /api/admin/dashboard/recent-orders
export const getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .sort({ ordered_at: -1 })
      .limit(10);

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending vendor approvals
// @route   GET /api/admin/dashboard/pending-vendors
export const getPendingVendors = async (req, res) => {
  try {
    const vendors = await Restaurant.find({ status: 'pending' })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
