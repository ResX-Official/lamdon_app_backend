"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileController_1 = require("../controllers/profileController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Profile routes - require authentication
router.get('/', auth_1.authenticateToken, profileController_1.getUserProfile);
router.put('/', auth_1.authenticateToken, profileController_1.updateUserProfile);
exports.default = router;
