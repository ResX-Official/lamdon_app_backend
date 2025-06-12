import { Request, Response } from 'express';
import { Review } from '../models/review';

// Create a review
export const createReview = async (req: Request, res: Response) => {
  try {
    const { property, guest, rating, comment } = req.body;
    const review = new Review({ property, guest, rating, comment });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Error creating review.' });
  }
};

// Get all reviews for a property
export const getReviewsForProperty = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ property: req.params.propertyId })
      .populate('guest', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews.' });
  }
};