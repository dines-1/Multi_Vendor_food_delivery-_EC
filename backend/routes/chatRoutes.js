import express from 'express';
import {
  getConversations,
  sendMessage,
  getMessages
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.post('/messages', sendMessage);
router.get('/conversations/:id/messages', getMessages);

export default router;
