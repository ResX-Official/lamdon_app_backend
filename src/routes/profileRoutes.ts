import { Router } from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/profileController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Profile routes - require authentication
router.get('/', authenticateToken, getUserProfile);
router.put('/', authenticateToken, updateUserProfile);

export default router; 