import User from '../models/User.js';
import bcrypt from 'bcryptjs';

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
