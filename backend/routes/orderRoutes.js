import express from 'express';
import {
  checkout,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  acceptOrder,
  rejectOrder,
  cancelOrder,
  reorder,
  getVendorOrders,
  getVendorRevenue
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Customer routes
router.post('/checkout', checkout);
router.get('/my-orders', getMyOrders);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/reorder', reorder);

// Vendor-specific routes
router.get('/vendor/my-orders', authorize('vendor'), getVendorOrders);
router.get('/vendor/revenue', authorize('vendor'), getVendorRevenue);
router.post('/:id/accept', authorize('vendor'), acceptOrder);
router.post('/:id/reject', authorize('vendor'), rejectOrder);

// Status update (vendor / delivery / admin)
router.put('/:id/status', authorize('vendor', 'delivery', 'admin'), updateOrderStatus);

// Single order detail (customer, vendor, admin)
router.get('/:id', getOrderById);

export default router;
