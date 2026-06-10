import express from 'express';
import {
  register,
  registerVendor,
  registerDelivery,
  login,
  getMe,
  updateDetails
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/register-vendor', registerVendor);
router.post('/register-delivery', registerDelivery);

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);

export default router;
