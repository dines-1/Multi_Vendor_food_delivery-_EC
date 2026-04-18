import express from 'express';
import {
  addReview,
  getRestaurantReviews
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, addReview);
router.get('/restaurant/:id', getRestaurantReviews);

export default router;
