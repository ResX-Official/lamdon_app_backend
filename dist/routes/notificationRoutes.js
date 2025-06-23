"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
router.get('/:userId', notificationController_1.getNotifications);
router.put('/:id/read', notificationController_1.markAsRead);
exports.default = router;
