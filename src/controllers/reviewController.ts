import { Request, Response } from 'express';
import { Review } from '../models/review';
import { Booking } from '../models/booking';
import { Property } from '../models/property';

// Create a review
export const createReview = async (req: Request, res: Response) => {
  try {
    const { propertyId, rating, comment } = req.body;
    const guestId = req.user?.id;

    if (!guestId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // Validate required fields
    if (!propertyId || !rating) {
      return res.status(400).json({ 
        success: false,
        message: 'Property ID and rating are required.' 
      });
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ 
        success: false,
        message: 'Property not found.' 
      });
    }

    // Check if user has completed a booking for this property
    const completedBooking = await Booking.findOne({ 
      property: propertyId, 
      guest: guestId, 
      status: 'completed' 
    });

    if (!completedBooking) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only review properties you have stayed at.' 
      });
    }

    // Check if user already reviewed this property
    const existingReview = await Review.findOne({ 
      property: propertyId, 
      guest: guestId 
    });

    if (existingReview) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already reviewed this property.' 
      });
    }

    const review = new Review({ 
      property: propertyId, 
      guest: guestId, 
      rating: Math.round(Number(rating)), 
      comment: comment || '' 
    });
    
    await review.save();
    await review.populate('guest', 'firstName lastName profileImage');
    
    res.status(201).json({
      success: true,
      data: review,
      message: 'Review created successfully'
    });
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error creating review.' 
    });
  }
};

// Get all reviews for a property with pagination
export const getReviewsForProperty = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments({ property: propertyId });

    const reviews = await Review.find({ property: propertyId })
      .populate('guest', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Calculate average rating
    const avgRatingResult = await Review.aggregate([
      { $match: { property: propertyId } },
      { 
        $group: { 
          _id: null, 
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        } 
      }
    ]);

    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;
    const totalReviews = avgRatingResult.length > 0 ? avgRatingResult[0].totalReviews : 0;

    res.json({
      success: true,
      data: reviews,
      statistics: {
        averageRating: Number(avgRating.toFixed(1)),
        totalReviews
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching reviews.' 
    });
  }
};

// Get user's reviews
export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const reviews = await Review.find({ guest: userId })
      .populate('property', 'title address images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });
  } catch (err) {
    console.error('Error fetching user reviews:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user reviews.' 
    });
  }
};

// Update a review
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const review = await Review.findOne({ _id: reviewId, guest: userId });
    if (!review) {
      return res.status(404).json({ 
        success: false,
        message: 'Review not found or you are not authorized to update it.' 
      });
    }

    if (rating) review.rating = Math.round(Number(rating));
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await review.populate('guest', 'firstName lastName profileImage');

    res.json({
      success: true,
      data: review,
      message: 'Review updated successfully'
    });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error updating review.' 
    });
  }
};

// Delete a review
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const review = await Review.findOneAndDelete({ _id: reviewId, guest: userId });
    if (!review) {
      return res.status(404).json({ 
        success: false,
        message: 'Review not found or you are not authorized to delete it.' 
      });
    }

    res.json({ 
      success: true,
      message: 'Review deleted successfully.' 
    });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting review.' 
    });
  }
};
