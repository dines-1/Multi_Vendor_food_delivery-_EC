import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getKPIMetrics,
  getDailyRevenue,
  getOrdersPerDay,
  getOrderStatusBreakdown,
  getRecentOrders,
  getPendingVendors,
} from '../controllers/adminDashboardController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));

router.get('/kpi', getKPIMetrics);
router.get('/revenue-chart', getDailyRevenue);
router.get('/orders-chart', getOrdersPerDay);
router.get('/order-status', getOrderStatusBreakdown);
router.get('/recent-orders', getRecentOrders);
router.get('/pending-vendors', getPendingVendors);

export default router;
