import { Router } from 'express';
import { uploadImage, uploadMultipleImages } from '../controllers/uploadController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/image', authenticateToken, uploadImage);
router.post('/images', authenticateToken, uploadMultipleImages);

export default router; 