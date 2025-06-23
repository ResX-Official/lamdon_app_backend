import { Request, Response } from 'express';
import { Property } from '../models/property';

export const createProperty = async (req: Request, res: Response) => {
  try {
    const { title, description, address, price, images, host, placeType, placeDescription } = req.body;
    
    // Validate required fields
    if (!title || !description || !address || !price || !host) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, description, address, price, and host are required.' 
      });
    }

    const property = new Property({ 
      title, 
      description, 
      address, 
      price, 
      images: images || [], 
      host,
      placeType,
      placeDescription
    });
    
    await property.save();
    res.status(201).json(property);
  } catch (err) {
    console.error('Error creating property:', err);
    res.status(500).json({ message: 'Error creating property.' });
  }
};

export const getProperties = async (req: Request, res: Response) => {
  try {
    const properties = await Property.find().populate('host', 'firstName lastName email');
    res.json(properties);
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ message: 'Error fetching properties.' });
  }
};

export const getProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id).populate('host', 'firstName lastName email');
    if (!property) return res.status(404).json({ message: 'Property not found.' });
    res.json(property);
  } catch (err) {
    console.error('Error fetching property:', err);
    res.status(500).json({ message: 'Error fetching property.' });
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!property) return res.status(404).json({ message: 'Property not found.' });
    res.json(property);
  } catch (err) {
    console.error('Error updating property:', err);
    res.status(500).json({ message: 'Error updating property.' });
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found.' });
    res.json({ message: 'Property deleted.' });
  } catch (err) {
    console.error('Error deleting property:', err);
    res.status(500).json({ message: 'Error deleting property.' });
  }
};