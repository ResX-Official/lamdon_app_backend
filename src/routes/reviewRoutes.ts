import { Router } from 'express';
import { createReview, getReviewsForProperty } from '../controllers/reviewController';

const router = Router();

router.post('/', createReview);
router.get('/property/:propertyId', getReviewsForProperty);

export default router;