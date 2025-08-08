import { Request, Response } from 'express';
import { Notification } from '../models/notification';

// Get all notifications for a user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications.' });
  }
};

// Mark a notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification.' });
  }
};