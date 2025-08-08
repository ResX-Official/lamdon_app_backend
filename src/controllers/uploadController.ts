import { Request, Response } from 'express';
import upload from '../utils/multer';
import cloudinary from '../utils/cloudinary';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    upload.single('image')(req, res, async (err: any) => {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(400).json({ 
          success: false,
          message: 'Error uploading file', 
          error: err.message || err 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'No file uploaded' 
        });
      }

      console.log('File uploaded successfully:', req.file.path);

      res.json({ 
        success: true,
        data: [req.file.path],
        url: req.file.path 
      });
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error uploading image', 
      error: error instanceof Error ? error.message : error 
    });
  }
};

export const uploadMultipleImages = async (req: Request, res: Response) => {
  try {
    upload.array('images', 10)(req, res, async (err: any) => {
      if (err) {
        console.error('Error uploading files:', err);
        return res.status(400).json({ 
          success: false,
          message: 'Error uploading files', 
          error: err.message || err 
        });
      }

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'No files uploaded' 
        });
      }

      const urls = (req.files as Express.Multer.File[]).map(file => file.path);
      console.log('Files uploaded successfully:', urls);

      res.json({ 
        success: true,
        data: urls,
        urls: urls 
      });
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error uploading images', 
      error: error instanceof Error ? error.message : error 
    });
  }
}; 