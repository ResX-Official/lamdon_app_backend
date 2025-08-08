import { Router } from 'express';
import { 
  createReview, 
  getReviewsForProperty, 
  getUserReviews, 
  updateReview, 
  deleteReview 
} from '../controllers/reviewController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/property/:propertyId', getReviewsForProperty);

// Protected routes
router.post('/', authenticateToken, createReview);
router.get('/my-reviews', authenticateToken, getUserReviews);
router.put('/:reviewId', authenticateToken, updateReview);
router.delete('/:reviewId', authenticateToken, deleteReview);

export default router;
