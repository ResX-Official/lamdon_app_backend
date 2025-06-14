import { Router } from 'express';
import { updateBookingStatus } from '../controllers/bookingController';

const router = Router();

router.put('/:id/status', updateBookingStatus);

export default router;