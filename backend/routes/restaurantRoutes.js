import express from 'express';
import {
  getRestaurants,
  getCuisines,
  getRestaurant,
  getMyRestaurant,
  updateVendorProfile
} from '../controllers/restaurantController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getRestaurants);
router.get('/cuisines', getCuisines);

// Vendor specific routes
router.get('/vendor/my-restaurant', protect, authorize('vendor'), getMyRestaurant);
router.post('/vendor/profile', protect, authorize('vendor'), updateVendorProfile);

router.get('/:id', getRestaurant);

export default router;
