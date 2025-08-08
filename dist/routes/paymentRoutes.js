"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
router.post('/initialize', paymentController_1.initializePayment);
router.get('/verify/:reference', paymentController_1.verifyPayment);
exports.default = router;
