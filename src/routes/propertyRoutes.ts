import { Router } from 'express';
import {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty
} from '../controllers/propertyController';

const router = Router();

router.post('/', createProperty);
router.get('/', getProperties);
router.get('/:id', getProperty);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

export default router;