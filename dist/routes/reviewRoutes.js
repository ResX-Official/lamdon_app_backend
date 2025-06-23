"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviewController_1 = require("../controllers/reviewController");
const router = (0, express_1.Router)();
router.post('/', reviewController_1.createReview);
router.get('/property/:propertyId', reviewController_1.getReviewsForProperty);
exports.default = router;
