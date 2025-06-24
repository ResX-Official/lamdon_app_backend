import { Router } from 'express';
import { 
  sendMessage, 
  getChatForBooking, 
  getChatForProperty,
  getUserConversations,
  getConversationMessages
} from '../controllers/chatController';

const router = Router();

router.post('/', sendMessage);
router.get('/booking/:bookingId', getChatForBooking);
router.get('/property/:propertyId/:userId1/:userId2', getChatForProperty);
router.get('/conversations/:userId', getUserConversations);
router.get('/conversation/:conversationId', getConversationMessages);

export default router;