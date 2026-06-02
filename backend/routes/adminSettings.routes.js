import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  getShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
} from '../controllers/adminSettingsController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));


// Sub-admins
router.get('/sub-admins', getSubAdmins);
router.post('/sub-admins', createSubAdmin);
router.put('/sub-admins/:id', updateSubAdmin);
router.delete('/sub-admins/:id', deleteSubAdmin);

// Shipping zones
router.get('/shipping-zones', getShippingZones);
router.post('/shipping-zones', createShippingZone);
router.put('/shipping-zones/:id', updateShippingZone);
router.delete('/shipping-zones/:id', deleteShippingZone);

export default router;
