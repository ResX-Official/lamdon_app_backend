import { Router } from 'express';
import { 
  createBooking, 
  getBookingsForProperty, 
  getBookingsForGuest, 
  updateBookingStatus,
  checkAvailability,
  getBookingStats
} from '../controllers/bookingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All booking routes require authentication
router.use(authenticateToken);

// Create a new booking
router.post('/', createBooking);

// Get bookings for a specific property (for host)
router.get('/property/:propertyId', getBookingsForProperty);

// Get bookings for a specific guest
router.get('/guest/:guestId', getBookingsForGuest);

// Check property availability
router.post('/check-availability', checkAvailability);

// Update booking status (confirm/reject)
router.put('/:id/status', updateBookingStatus);

// Get booking statistics for host
router.get('/host/:hostId/stats', getBookingStats);

export default router;