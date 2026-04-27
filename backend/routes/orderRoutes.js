import express from 'express';
import {
  checkout,
  getMyOrders,
  updateOrderStatus,
  cancelOrder,
  reorder,
  getVendorOrders,
  getVendorRevenue
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/checkout', checkout);
router.get('/my-orders', getMyOrders);

// Vendor specific routes
router.get('/vendor/my-orders', authorize('vendor'), getVendorOrders);
router.get('/vendor/revenue', authorize('vendor'), getVendorRevenue);

router.put('/:id/status', authorize('vendor', 'delivery', 'admin'), updateOrderStatus);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/reorder', reorder);

export default router;
