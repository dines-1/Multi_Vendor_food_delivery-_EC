import express from 'express';
import { 
  initiateEsewa, 
  verifyEsewa,
  failEsewa,
  initiateStripe,
  verifyStripe,
  failStripe
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/esewa/initiate', protect, initiateEsewa);
router.get('/esewa/verify', verifyEsewa);
router.get('/esewa/failure', failEsewa);
router.post('/stripe/initiate', protect, initiateStripe);
router.get('/stripe/verify', verifyStripe);
router.get('/stripe/failure', failStripe);

export default router;
