import ShippingZone from '../models/ShippingZone.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// ==================== SHIPPING ZONES ====================

export const getShippingZones = async (req, res) => {
  try {
    const zones = await ShippingZone.find().sort({ createdAt: -1 });
    res.json({ success: true, data: zones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createShippingZone = async (req, res) => {
  try {
    const zone = await ShippingZone.create(req.body);
    res.status(201).json({ success: true, data: zone, message: 'Shipping zone created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateShippingZone = async (req, res) => {
  try {
    const zone = await ShippingZone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    res.json({ success: true, data: zone, message: 'Zone updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteShippingZone = async (req, res) => {
  try {
    await ShippingZone.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Zone deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUB-ADMINS ====================

export const getSubAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, permissions } = req.body;
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const admin = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'admin',
      permissions: permissions || ['full-access'],
    });
    const result = admin.toObject();
    delete result.password;
    res.status(201).json({ success: true, data: result, message: 'Sub-admin created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubAdmin = async (req, res) => {
  try {
    const { permissions } = req.body;
    const admin = await User.findByIdAndUpdate(req.params.id, { permissions }, { new: true }).select('-password');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, data: admin, message: 'Permissions updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubAdmin = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Sub-admin deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
