"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviewsForProperty = exports.createReview = void 0;
const review_1 = require("../models/review");
// Create a review
const createReview = async (req, res) => {
    try {
        const { property, guest, rating, comment } = req.body;
        const review = new review_1.Review({ property, guest, rating, comment });
        await review.save();
        res.status(201).json(review);
    }
    catch (err) {
        res.status(500).json({ message: 'Error creating review.' });
    }
};
exports.createReview = createReview;
// Get all reviews for a property
const getReviewsForProperty = async (req, res) => {
    try {
        const reviews = await review_1.Review.find({ property: req.params.propertyId })
            .populate('guest', 'firstName lastName')
            .sort({ createdAt: -1 });
        res.json(reviews);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching reviews.' });
    }
};
exports.getReviewsForProperty = getReviewsForProperty;
