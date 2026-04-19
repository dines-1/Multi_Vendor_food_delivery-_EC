import express from 'express';
import {
  getRestaurants,
  getCuisines,
  getRestaurant
} from '../controllers/restaurantController.js';

const router = express.Router();

router.get('/', getRestaurants);
router.get('/cuisines', getCuisines);
router.get('/:id', getRestaurant);

export default router;
