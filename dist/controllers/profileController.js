"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = exports.getUserProfile = void 0;
const user_1 = require("../models/user");
// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const user = await user_1.User.findById(userId).select('-password -confirmationCode');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting user profile'
        });
    }
};
exports.getUserProfile = getUserProfile;
// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const updates = req.body;
        console.log('Profile update request:', { userId, updates });
        // Remove sensitive fields that shouldn't be updated via this endpoint
        const { password, confirmationCode, isConfirmed, isAdmin, userType, ...safeUpdates } = updates;
        const user = await user_1.User.findByIdAndUpdate(userId, safeUpdates, { new: true, runValidators: true }).select('-password -confirmationCode');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        console.log('Profile updated successfully:', user);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user profile',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateUserProfile = updateUserProfile;
