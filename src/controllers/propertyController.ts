import { Request, Response } from 'express';
import { Property } from '../models/property';

export const createProperty = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      address, 
      price, 
      images, 
      placeType, 
      placeDescription, 
      guests, 
      bedrooms, 
      toilets,
      maxGuests,
      propertyType,
      location,
      amenities,
      houseRules,
      cancellationPolicy,
      checkInTime,
      checkOutTime
    } = req.body;
    
    console.log('Creating property with data:', req.body);
    console.log('Authenticated user:', req.user);
    
    // Validate required fields
    if (!title || !description || !address || !price) {
      console.log('Missing required fields:', { title, description, address, price });
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: title, description, address, and price are required.' 
      });
    }

    // Use authenticated user as host
    const host = req.user?.id;
    if (!host) {
      console.log('No authenticated user found');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const property = new Property({ 
      title, 
      description, 
      address, 
      price, 
      images: images || [], 
      host,
      placeType: placeType || 'apartment',
      placeDescription,
      guests: guests || 1,
      bedrooms: bedrooms || 1,
      toilets: toilets || 1,
      maxGuests: maxGuests || guests || 1,
      propertyType: propertyType || 'apartment',
      location: location || {
        latitude: 6.5244,
        longitude: 3.3792,
        city: 'Lagos',
        state: 'Lagos State',
        country: 'Nigeria',
        zipCode: ''
      },
      amenities: amenities || [],
      houseRules: houseRules || [],
      cancellationPolicy: cancellationPolicy || 'Flexible',
      checkInTime: checkInTime || '3:00 PM',
      checkOutTime: checkOutTime || '11:00 AM',
      status: 'pending' // Set initial status to pending
    });
    
    console.log('Saving property:', property);
    await property.save();
    
    // Populate host information before sending response
    await property.populate('host', 'firstName lastName email');
    
    console.log('Property created successfully:', property._id);
    
    res.status(201).json({
      success: true,
      data: property,
      message: 'Property created successfully'
    });
  } catch (err) {
    console.error('Error creating property:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error creating property: ' + (err instanceof Error ? err.message : 'Unknown error')
    });
  }
};

export const getProperties = async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      city, 
      state, 
      country, 
      propertyType, 
      minPrice, 
      maxPrice, 
      guests, 
      bedrooms, 
      amenities,
      page = 1,
      limit = 10
    } = req.query;

    // Build search query
    let query: any = { status: 'approved' };

    // Text search in title, description, and address
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } }
      ];
    }

    // Location filters
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (state) query['location.state'] = { $regex: state, $options: 'i' };
    if (country) query['location.country'] = { $regex: country, $options: 'i' };

    // Property type filter
    if (propertyType) query.propertyType = propertyType;

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Guest capacity filter
    if (guests) query.maxGuests = { $gte: Number(guests) };

    // Bedrooms filter
    if (bedrooms) query.bedrooms = { $gte: Number(bedrooms) };

    // Amenities filter
    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      query.amenities = { $in: amenitiesArray };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Property.countDocuments(query);

    const properties = await Property.find(query)
      .populate('host', 'firstName lastName email phone profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      count: properties.length
    });
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching properties.' 
    });
  }
};

// Get current user's properties (all statuses)
export const getMyProperties = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const properties = await Property.find({ host: userId }).populate('host', 'firstName lastName email');
    res.json({
      success: true,
      data: properties,
      count: properties.length
    });
  } catch (err) {
    console.error('Error fetching user properties:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user properties.' 
    });
  }
};

export const getProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id).populate('host', 'firstName lastName email');
    if (!property) {
      return res.status(404).json({ 
        success: false,
        message: 'Property not found.' 
      });
    }
    res.json({
      success: true,
      data: property
    });
  } catch (err) {
    console.error('Error fetching property:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching property.' 
    });
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!property) {
      return res.status(404).json({ 
        success: false,
        message: 'Property not found.' 
      });
    }
    await property.populate('host', 'firstName lastName email');
    res.json({
      success: true,
      data: property,
      message: 'Property updated successfully'
    });
  } catch (err) {
    console.error('Error updating property:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error updating property.' 
    });
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) {
      return res.status(404).json({ 
        success: false,
        message: 'Property not found.' 
      });
    }
    res.json({ 
      success: true,
      message: 'Property deleted successfully.' 
    });
  } catch (err) {
    console.error('Error deleting property:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting property.' 
    });
  }
};