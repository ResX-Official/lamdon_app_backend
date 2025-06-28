import { Router } from 'express';
import {
  createProperty,
  getProperties,
  getMyProperties,
  getProperty,
  updateProperty,
  deleteProperty
} from '../controllers/propertyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.get('/', getProperties);
router.get('/:id', getProperty);

// Protected routes (authentication required)
router.get('/my-properties', authenticateToken, getMyProperties);
router.post('/', authenticateToken, createProperty);
router.put('/:id', authenticateToken, updateProperty);
router.delete('/:id', authenticateToken, deleteProperty);

export default router;