"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.getNotifications = void 0;
const notification_1 = require("../models/notification");
// Get all notifications for a user
const getNotifications = async (req, res) => {
    try {
        const notifications = await notification_1.Notification.find({ user: req.params.userId }).sort({ createdAt: -1 });
        res.json(notifications);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching notifications.' });
    }
};
exports.getNotifications = getNotifications;
// Mark a notification as read
const markAsRead = async (req, res) => {
    try {
        const notification = await notification_1.Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
        if (!notification)
            return res.status(404).json({ message: 'Notification not found.' });
        res.json(notification);
    }
    catch (err) {
        res.status(500).json({ message: 'Error updating notification.' });
    }
};
exports.markAsRead = markAsRead;
