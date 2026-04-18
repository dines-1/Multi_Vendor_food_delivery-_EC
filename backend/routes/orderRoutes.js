import express from 'express';
import {
  checkout,
  getMyOrders,
  updateOrderStatus,
  cancelOrder,
  reorder
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/checkout', checkout);
router.get('/my-orders', getMyOrders);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/reorder', reorder);

export default router;
