"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.post('/signup', authController_1.register);
router.post('/login', authController_1.login);
router.post('/confirm-email', authController_1.confirmEmail);
exports.default = router;
