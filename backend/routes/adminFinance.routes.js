import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getRevenueReport,
  getCommissionSettings,
  updateCommission,
  getVendorEarnings,
  getPayoutRequests,
  processPayoutRequest,
  exportFinanceCSV,
} from '../controllers/adminFinanceController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));

router.get('/revenue', getRevenueReport);
router.get('/commission', getCommissionSettings);
router.put('/commission', updateCommission);
router.get('/vendor-earnings', getVendorEarnings);
router.get('/payouts', getPayoutRequests);
router.put('/payouts/:id', processPayoutRequest);
router.get('/export', exportFinanceCSV);

export default router;
