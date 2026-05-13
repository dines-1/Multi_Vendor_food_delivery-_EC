import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
} from '../controllers/adminSettingsController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));


// Sub-admins
router.get('/sub-admins', getSubAdmins);
router.post('/sub-admins', createSubAdmin);
router.put('/sub-admins/:id', updateSubAdmin);
router.delete('/sub-admins/:id', deleteSubAdmin);

export default router;
