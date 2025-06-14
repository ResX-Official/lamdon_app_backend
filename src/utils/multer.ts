import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lamdon_properties',
    format: async (req: any, file: any) => 'png', // or use file.mimetype.split('/')[1]
    public_id: (req: any, file: any) => file.originalname,
  },
});

const upload = multer({ storage });

export default upload;