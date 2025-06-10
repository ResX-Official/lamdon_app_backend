import { Router } from 'express';
import { sendMessage, getChatForBooking } from '../controllers/chatController';

const router = Router();

router.post('/', sendMessage);
router.get('/booking/:bookingId', getChatForBooking);

export default router;