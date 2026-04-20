import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getUsers,
  getUserDetail,
  banUser,
  unbanUser,
  changeUserRole,
  exportUsersCSV,
} from '../controllers/adminUserController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));

router.get('/export', exportUsersCSV);
router.get('/', getUsers);
router.get('/:id', getUserDetail);
router.put('/:id/ban', banUser);
router.put('/:id/unban', unbanUser);
router.put('/:id/role', changeUserRole);

export default router;
