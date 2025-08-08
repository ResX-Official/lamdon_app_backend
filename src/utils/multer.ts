import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new Error('Only image files are allowed!');
    }
    
    // Validate file size
    if (file.size && file.size > MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }
    
    let format = 'jpg';
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      const ext = file.mimetype.split('/')[1];
      if (['jpeg', 'png', 'jpg', 'webp', 'gif'].includes(ext)) {
        format = ext;
      }
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueName = `${timestamp}_${randomString}`;
    
    return {
      folder: 'lamdon_properties',
      format,
      public_id: uniqueName,
    };
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

export default upload;