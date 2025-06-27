"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadController_1 = require("../controllers/uploadController");
const router = (0, express_1.Router)();
router.post('/image', uploadController_1.uploadImage);
router.post('/images', uploadController_1.uploadMultipleImages);
exports.default = router;
