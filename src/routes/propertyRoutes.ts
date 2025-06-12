import { Router } from 'express';
import {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty
} from '../controllers/propertyController';
import upload from '../utils/multer';

const router = Router();

router.post('/', createProperty);
router.get('/', getProperties);
router.get('/:id', getProperty);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);
router.post('/upload', upload.array('images', 5), (req, res) => {
  // req.files will be an array of uploaded files
  const imageUrls = (req.files as any[]).map(file => file.path);
  res.json({ imageUrls });
});

export default router;