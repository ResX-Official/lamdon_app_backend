"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = void 0;
const user_1 = require("../models/user");
const jwt_1 = require("../utils/jwt");
const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }
        // Verify JWT token
        const decoded = (0, jwt_1.verifyToken)(token);
        req.adminUser = decoded;
        // Get user from database
        const user = await user_1.User.findById(decoded.userId).select('-password -confirmationCode');
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }
        // Check if user is admin
        if (!user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
        }
        // Check if user is blocked
        if (user.blocked) {
            return res.status(403).json({ success: false, message: 'Access denied. Account is blocked.' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};
exports.adminAuth = adminAuth;
