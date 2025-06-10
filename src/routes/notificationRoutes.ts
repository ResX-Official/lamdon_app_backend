import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController';

const router = Router();

router.get('/:userId', getNotifications);
router.put('/:id/read', markAsRead);

export default router;