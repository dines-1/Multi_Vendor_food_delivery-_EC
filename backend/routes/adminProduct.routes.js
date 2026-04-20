import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
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
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
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
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Subcategories
router.get('/subcategories', getSubcategories);
router.post('/subcategories', createSubcategory);
router.put('/subcategories/:id', updateSubcategory);
router.delete('/subcategories/:id', deleteSubcategory);

// Reviews
router.delete('/reviews/:id', removeReview);

export default router;
