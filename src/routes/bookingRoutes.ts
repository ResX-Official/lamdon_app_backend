import { Router } from 'express';
import {
  createBooking,
  getBookingsForProperty,
  getBookingsForGuest,
  updateBookingStatus
} from '../controllers/bookingController';

const router = Router();

router.post('/', createBooking);
router.get('/property/:propertyId', getBookingsForProperty);
router.get('/guest/:guestId', getBookingsForGuest);
router.put('/:id/status', updateBookingStatus);

export default router;