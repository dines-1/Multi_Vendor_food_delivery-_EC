import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/clear', clearCart);          // DELETE /api/cart/clear  – clears full cart
router.delete('/:itemId', removeCartItem);   // DELETE /api/cart/:itemId – removes one item

export default router;
