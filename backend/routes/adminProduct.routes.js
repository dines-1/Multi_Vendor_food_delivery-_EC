import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getProducts,
  approveProduct,
  rejectProduct,
  removeProduct,
  toggleFeatured,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  removeReview,
} from '../controllers/adminProductController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));

// Products
router.get('/', getProducts);
router.put('/:id/approve', approveProduct);
router.put('/:id/reject', rejectProduct);
router.delete('/:id', removeProduct);
router.put('/:id/featured', toggleFeatured);

// Categories
router.get('/categories', getCategories);
router.post('/categories', upload.single('image'), createCategory);
router.put('/categories/:id', upload.single('image'), updateCategory);
router.delete('/categories/:id', deleteCategory);


// Reviews
router.delete('/reviews/:id', removeReview);

export default router;
