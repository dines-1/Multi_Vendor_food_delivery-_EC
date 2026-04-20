import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';

// @desc    Get all vendors with search + filter
// @route   GET /api/admin/vendors
export const getVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: 'owner',
      sort: { createdAt: -1 },
    };

    const vendors = await Restaurant.paginate(query, options);
    res.json({ success: true, data: vendors.docs, pagination: { total: vendors.totalDocs, page: vendors.page, pages: vendors.totalPages } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vendor detail
// @route   GET /api/admin/vendors/:id
export const getVendorDetail = async (req, res) => {
  try {
    const vendor = await Restaurant.findById(req.params.id).populate('owner', 'name email phone');
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const orderCount = await Order.countDocuments({ restaurant: vendor._id });
    const totalSales = await Order.aggregate([
      { $match: { restaurant: vendor._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]);

    const recentOrders = await Order.find({ restaurant: vendor._id })
      .populate('customer', 'name')
      .sort({ ordered_at: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        vendor,
        stats: { orderCount, totalSales: totalSales[0]?.total || 0 },
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve vendor
// @route   PUT /api/admin/vendors/:id/approve
export const approveVendor = async (req, res) => {
  try {
    const vendor = await Restaurant.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: vendor, message: 'Vendor approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject vendor
// @route   PUT /api/admin/vendors/:id/reject
export const rejectVendor = async (req, res) => {
  try {
    const vendor = await Restaurant.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: vendor, message: 'Vendor rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Suspend vendor
// @route   PUT /api/admin/vendors/:id/suspend
export const suspendVendor = async (req, res) => {
  try {
    const { reason } = req.body;
    const vendor = await Restaurant.findByIdAndUpdate(req.params.id, { status: 'suspended', suspendReason: reason || '' }, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: vendor, message: 'Vendor suspended' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reactivate vendor
// @route   PUT /api/admin/vendors/:id/reactivate
export const reactivateVendor = async (req, res) => {
  try {
    const vendor = await Restaurant.findByIdAndUpdate(req.params.id, { status: 'active', suspendReason: '' }, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: vendor, message: 'Vendor reactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set commission rate
// @route   PUT /api/admin/vendors/:id/commission
export const setCommissionRate = async (req, res) => {
  try {
    const { commissionRate } = req.body;
    const vendor = await Restaurant.findByIdAndUpdate(req.params.id, { commissionRate }, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: vendor, message: 'Commission rate updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vendor performance score
// @route   GET /api/admin/vendors/:id/performance
export const getPerformanceScore = async (req, res) => {
  try {
    const vendor = await Restaurant.findById(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const totalOrders = await Order.countDocuments({ restaurant: vendor._id });
    const deliveredOrders = await Order.countDocuments({ restaurant: vendor._id, status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ restaurant: vendor._id, status: 'cancelled' });

    const fulfilmentRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
    const cancelRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    // Performance = (rating * 20) + (fulfilment% * 0.5) - (cancelRate * 0.3)
    const score = Math.min(100, Math.max(0,
      (vendor.rating * 20) + (fulfilmentRate * 0.5) - (cancelRate * 0.3)
    ));

    await Restaurant.findByIdAndUpdate(vendor._id, { performanceScore: Math.round(score) });

    res.json({
      success: true,
      data: {
        score: Math.round(score),
        rating: vendor.rating,
        fulfilmentRate: Math.round(fulfilmentRate),
        cancelRate: Math.round(cancelRate),
        totalOrders,
        deliveredOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
