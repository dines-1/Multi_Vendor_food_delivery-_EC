import express from 'express';
import {
  getProfile,
  updateProfile,
  getOrderRequests,
  acceptOrder,
  getActiveOrders,
  updateLocation,
  getDeliveryHistory,
  getDeliveryStats
} from '../controllers/deliveryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('delivery'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/requests', getOrderRequests);
router.get('/active-orders', getActiveOrders);
router.get('/history', getDeliveryHistory);
router.get('/stats', getDeliveryStats);
router.put('/orders/:id/accept', acceptOrder);
router.put('/location', updateLocation);

export default router;
