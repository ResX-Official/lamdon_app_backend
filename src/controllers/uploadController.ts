import { Request, Response } from 'express';
import upload from '../utils/multer';
import cloudinary from '../utils/cloudinary';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    upload.single('image')(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({ message: 'Error uploading file' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      res.json({ url: req.file.path });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image' });
  }
};

export const uploadMultipleImages = async (req: Request, res: Response) => {
  try {
    upload.array('images', 10)(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({ message: 'Error uploading files' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const urls = (req.files as Express.Multer.File[]).map(file => file.path);
      
      res.json({ urls });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading images' });
  }
}; 