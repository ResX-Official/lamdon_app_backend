import { Request, Response } from 'express';
import upload from '../utils/multer';
import cloudinary from '../utils/cloudinary';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    upload.single('image')(req, res, async (err: any) => {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(400).json({ message: 'Error uploading file', error: err.message || err });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      res.json({ url: req.file.path });
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image', error: error instanceof Error ? error.message : error });
  }
};

export const uploadMultipleImages = async (req: Request, res: Response) => {
  try {
    upload.array('images', 10)(req, res, async (err: any) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res.status(400).json({ message: 'Error uploading files', error: err.message || err });
      }

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const urls = (req.files as Express.Multer.File[]).map(file => file.path);
      res.json({ urls });
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Error uploading images', error: error instanceof Error ? error.message : error });
  }
}; 