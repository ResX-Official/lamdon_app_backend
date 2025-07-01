import { Router } from 'express';
import { 
  sendMessage, 
  getChatForBooking, 
  getChatForProperty,
  getUserConversations,
  getConversationMessages,
  markConversationAsRead
} from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all chat routes
router.use(authenticateToken);

router.post('/', sendMessage);
router.get('/booking/:bookingId', getChatForBooking);
router.get('/property/:propertyId/:userId1/:userId2', getChatForProperty);
router.get('/conversations/:userId', getUserConversations);
router.get('/conversation/:conversationId', getConversationMessages);
router.post('/conversation/:conversationId/read', markConversationAsRead);

export default router;