import User from '../models/User.js';
import Order from '../models/Order.js';

// @desc    Get all users
// @route   GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const users = await User.paginate(query, options);

    // Attach order counts
    const usersWithCounts = await Promise.all(
      users.docs.map(async (user) => {
        const ordersCount = await Order.countDocuments({ customer: user._id });
        return { ...user.toObject(), ordersCount };
      })
    );

    res.json({
      success: true,
      data: usersWithCounts,
      pagination: { total: users.totalDocs, page: users.page, pages: users.totalPages },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user detail
// @route   GET /api/admin/users/:id
export const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const orders = await Order.find({ customer: user._id })
      .populate('restaurant', 'name')
      .sort({ ordered_at: -1 })
      .limit(20);

    res.json({ success: true, data: { user, orders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Ban user
// @route   PUT /api/admin/users/:id/ban
export const banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true, banReason: reason || '', isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: 'User banned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unban user
// @route   PUT /api/admin/users/:id/unban
export const unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, banReason: '', isActive: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: 'User unbanned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change user role
// @route   PUT /api/admin/users/:id/role
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'vendor', 'delivery', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export users as CSV
// @route   GET /api/admin/users/export
export const exportUsersCSV = async (req, res) => {
  try {
    const { Parser } = await import('json2csv');
    const users = await User.find().lean();
    const fields = ['name', 'email', 'phone', 'role', 'isActive', 'isBanned', 'createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(users);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
