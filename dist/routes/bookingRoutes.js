"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookingController_1 = require("../controllers/bookingController");
const router = (0, express_1.Router)();
router.put('/:id/status', bookingController_1.updateBookingStatus);
exports.default = router;
