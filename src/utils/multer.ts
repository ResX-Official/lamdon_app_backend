import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new Error('Only image files are allowed!');
    }
    let format = 'jpg';
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      const ext = file.mimetype.split('/')[1];
      if (['jpeg', 'png', 'jpg', 'webp', 'gif'].includes(ext)) {
        format = ext;
      }
    }
    return {
      folder: 'lamdon_properties',
      format,
      public_id: file.originalname,
    };
  },
});

const upload = multer({ storage });

export default upload;