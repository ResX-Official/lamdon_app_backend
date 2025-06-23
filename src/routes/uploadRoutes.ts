import { Router } from 'express';
import { uploadImage, uploadMultipleImages } from '../controllers/uploadController';

const router = Router();

router.post('/image', uploadImage);
router.post('/images', uploadMultipleImages);

export default router; 