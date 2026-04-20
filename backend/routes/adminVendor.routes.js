import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getVendors,
  getVendorDetail,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reactivateVendor,
  setCommissionRate,
  getPerformanceScore,
} from '../controllers/adminVendorController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));

router.get('/', getVendors);
router.get('/:id', getVendorDetail);
router.put('/:id/approve', approveVendor);
router.put('/:id/reject', rejectVendor);
router.put('/:id/suspend', suspendVendor);
router.put('/:id/reactivate', reactivateVendor);
router.put('/:id/commission', setCommissionRate);
router.get('/:id/performance', getPerformanceScore);

export default router;
