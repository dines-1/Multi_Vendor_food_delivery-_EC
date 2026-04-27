import express from 'express';
import {
  getMenuItems,
  getMenuItem,
  getRecentlyViewed,
  getVendorMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../controllers/menuController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Middleware to optionally set req.user if token is present
const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (err) {
      // Ignore invalid tokens for public routes
    }
  }
  next();
};

router.get('/', getMenuItems);
router.get('/recently-viewed', protect, getRecentlyViewed);

// Vendor specific routes
router.get('/vendor/my-menu', protect, authorize('vendor'), getVendorMenu);
router.post('/vendor', protect, authorize('vendor'), upload.single('image'), createMenuItem);
router.put('/vendor/:id', protect, authorize('vendor'), upload.single('image'), updateMenuItem);
router.delete('/vendor/:id', protect, authorize('vendor'), deleteMenuItem);

router.get('/:id', optionalProtect, getMenuItem);

export default router;
