import DeliveryPerson from '../models/DeliveryPerson.js';
import Order from '../models/Order.js';

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
    const { vehicle_type, license_plate, isAvailable } = req.body;
    
    const delivery = await DeliveryPerson.findOneAndUpdate(
      { user: req.user.id },
      { vehicle_type, license_plate, isAvailable },
      { new: true, runValidators: true }
    );

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
    const orders = await Order.find({
      status: 'confirmed',
      delivery_person_id: null
    }).populate('restaurant', 'name address coordinates').sort('-createdAt');

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept an order
// @route   PUT /api/delivery/orders/:id/accept
// @access  Private/Delivery
export const acceptOrder = async (req, res) => {
  try {
    const delivery = await DeliveryPerson.findOne({ user: req.user.id });
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery profile not found' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.delivery_person_id) {
      return res.status(400).json({ success: false, message: 'Order already accepted by someone else' });
    }

    order.delivery_person_id = delivery._id;
    order.status = 'preparing'; // Or 'out_for_delivery' based on flow
    await order.save();

    // Emit socket event for status update
    if (global.io) {
      global.io.to(`order_${order._id}`).emit('status-updated', {
        orderId: order._id,
        status: order.status
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active deliveries
// @route   GET /api/delivery/active-orders
// @access  Private/Delivery
export const getActiveOrders = async (req, res) => {
  try {
    const delivery = await DeliveryPerson.findOne({ user: req.user.id });
    const orders = await Order.find({
      delivery_person_id: delivery._id,
      status: { $in: ['preparing', 'out_for_delivery'] }
    }).populate('restaurant', 'name address coordinates').sort('-createdAt');

    res.status(200).json({ success: true, data: orders });
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
