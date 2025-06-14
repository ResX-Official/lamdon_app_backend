import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'lamdon_properties',
    format: file.mimetype.split('/')[1], // e.g. 'jpg', 'png'
    public_id: file.originalname,
  }),
});

const upload = multer({ storage });

export default upload;