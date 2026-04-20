import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getOrders,
  getOrderDetail,
  overrideStatus,
  handleRefund,
  exportOrdersCSV,
  getDisputes,
  getDisputeDetail,
  resolveDispute,
} from '../controllers/adminOrderController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));

router.get('/export', exportOrdersCSV);
router.get('/', getOrders);
router.get('/disputes', getDisputes);
router.get('/disputes/:id', getDisputeDetail);
router.put('/disputes/:id/resolve', resolveDispute);
router.get('/:id', getOrderDetail);
router.put('/:id/status', overrideStatus);
router.put('/:id/refund', handleRefund);

export default router;
