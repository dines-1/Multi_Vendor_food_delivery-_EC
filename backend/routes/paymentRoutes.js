import express from 'express';
import { 
  initiateEsewa, 
  verifyEsewa 
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/esewa/initiate', protect, initiateEsewa);
router.get('/esewa/verify', verifyEsewa);

export default router;
