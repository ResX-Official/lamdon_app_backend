import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lamdon_properties',
    format: async (req, file) => 'png', // or use file.mimetype.split('/')[1]
    public_id: (req, file) => file.originalname,
  },
});

const upload = multer({ storage });

export default upload;