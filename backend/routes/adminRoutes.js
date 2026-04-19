import express from 'express';
import {
  getStats,
  getAdminRestaurants,
  updateRestaurantStatus,
  getAdminCustomers,
  updateUserActiveStatus,
  getAdminDeliveryPersonnel,
  updateDeliveryStatus,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply protection and admin authorization to all admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);

router.get('/restaurants', getAdminRestaurants);
router.put('/restaurants/:id/status', updateRestaurantStatus);

router.get('/customers', getAdminCustomers);
router.put('/users/:id/status', updateUserActiveStatus);

router.get('/delivery', getAdminDeliveryPersonnel);
router.put('/delivery/:id/status', updateDeliveryStatus);

export default router;
