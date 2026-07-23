import DeliveryPerson from '../models/DeliveryPerson.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

// @desc    Get current delivery person profile
// @route   GET /api/delivery/profile
// @access  Private/Delivery
export const getProfile = async (req, res) => {
  try {
    const delivery = await DeliveryPerson.findOne({ user: req.user.id }).populate('user', 'name email phone avatar');
    
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery profile not found' });
    }

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update delivery person profile
// @route   PUT /api/delivery/profile
// @access  Private/Delivery
export const updateProfile = async (req, res) => {
  try {
    const { vehicle_type, license_plate, isAvailable, name, phone } = req.body;
    const deliveryUpdate = {};

    if (vehicle_type !== undefined) deliveryUpdate.vehicle_type = vehicle_type;
    if (license_plate !== undefined) deliveryUpdate.license_plate = license_plate;
    if (isAvailable !== undefined) deliveryUpdate.isAvailable = isAvailable;
    
    const delivery = await DeliveryPerson.findOneAndUpdate(
      { user: req.user.id },
      deliveryUpdate,
      { new: true, runValidators: true }
    ).populate('user', 'name email phone avatar');

    // Update User details if name or phone provided
    if (name || phone) {
      const userUpdate = {};
      if (name) userUpdate.name = name;
      if (phone) userUpdate.phone = phone;
      
      await User.findByIdAndUpdate(req.user.id, userUpdate);
    }

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get new order requests (Confirmed orders without delivery person)
// @route   GET /api/delivery/requests
// @access  Private/Delivery
export const getOrderRequests = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept an order
// @route   PUT /api/delivery/orders/:id/accept
// @access  Private/Delivery
export const acceptOrder = async (req, res) => {
  try {
    res.status(410).json({
      success: false,
      message: 'Delivery person workflow is currently disabled'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active deliveries
// @route   GET /api/delivery/active-orders
// @access  Private/Delivery
export const getActiveOrders = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update delivery location
// @route   PUT /api/delivery/location
// @access  Private/Delivery
export const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    const delivery = await DeliveryPerson.findOneAndUpdate(
      { user: req.user.id },
      { current_location: { lat, lng } },
      { new: true }
    );

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Get delivery history
// @route   GET /api/delivery/history
// @access  Private/Delivery
export const getDeliveryHistory = async (req, res) => {
  try {
    const delivery = await DeliveryPerson.findOne({ user: req.user.id });
    const orders = await Order.find({
      delivery_person_id: delivery._id,
      status: 'delivered'
    }).populate('restaurant', 'name address').sort('-delivered_at');

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get delivery stats (Today/Total)
// @route   GET /api/delivery/stats
// @access  Private/Delivery
export const getDeliveryStats = async (req, res) => {
  try {
    const delivery = await DeliveryPerson.findOne({ user: req.user.id });
    
    // Total Delivered
    const totalDelivered = await Order.countDocuments({
      delivery_person_id: delivery._id,
      status: 'delivered'
    });

    // Today's stats
    const today = new Date();
    today.setHours(0,0,0,0);

    const todayOrders = await Order.find({
      delivery_person_id: delivery._id,
      status: 'delivered',
      delivered_at: { $gte: today }
    });

    const todayEarnings = todayOrders.reduce((sum, order) => sum + order.delivery_fee, 0);

    res.status(200).json({
      success: true,
      data: {
        totalDelivered,
        todayDeliveries: todayOrders.length,
        todayEarnings,
        rating: 4.8 // Mock rating
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
