import { Request, Response } from 'express';
import { ChatMessage } from '../models/chatMessage';

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { booking, sender, message } = req.body;
    const chatMessage = new ChatMessage({ booking, sender, message });
    await chatMessage.save();
    res.status(201).json(chatMessage);
  } catch (err) {
    res.status(500).json({ message: 'Error sending message.' });
  }
};

// Get chat history for a booking
export const getChatForBooking = async (req: Request, res: Response) => {
  try {
    const messages = await ChatMessage.find({ booking: req.params.bookingId })
      .populate('sender', 'firstName lastName email')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching chat history.' });
  }
};