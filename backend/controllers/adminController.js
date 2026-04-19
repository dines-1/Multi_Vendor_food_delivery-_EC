import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import DeliveryPerson from '../models/DeliveryPerson.js';
import Order from '../models/Order.js';

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const totalDelivery = await User.countDocuments({ role: 'delivery' });
    const totalRestaurants = await Restaurant.countDocuments();
    const activeRestaurants = await Restaurant.countDocuments({ status: 'active' });
    const pendingRestaurants = await Restaurant.countDocuments({ status: 'pending' });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Aggregate monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const revenueStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: { customer: totalUsers, vendor: totalVendors, delivery: totalDelivery },
        restaurants: { total: totalRestaurants, active: activeRestaurants, pending: pendingRestaurants },
        orders: { total: totalOrders, pending: pendingOrders },
        revenueStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all restaurants
// @route   GET /api/admin/restaurants
// @access  Private/Admin
export const getAdminRestaurants = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      populate: 'owner',
      sort: { createdAt: -1 }
    };

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const restaurants = await Restaurant.paginate(query, options);

    res.status(200).json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update restaurant status
// @route   PUT /api/admin/restaurants/:id/status
// @access  Private/Admin
export const updateRestaurantStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'active', 'closed', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private/Admin
export const getAdminCustomers = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sort: { createdAt: -1 }
    };

    const query = { role: 'customer' };
    
    const customers = await User.paginate(query, options);

    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user active status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
export const updateUserActiveStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all delivery personnel
// @route   GET /api/admin/delivery
// @access  Private/Admin
export const getAdminDeliveryPersonnel = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      populate: 'user',
      sort: { createdAt: -1 }
    };

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const delivery = await DeliveryPerson.paginate(query, options);

    res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update delivery person status
// @route   PUT /api/admin/delivery/:id/status
// @access  Private/Admin
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const delivery = await DeliveryPerson.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery person not found' });
    }

    res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
