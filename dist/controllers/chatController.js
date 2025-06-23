"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatForBooking = exports.sendMessage = void 0;
const chatMessage_1 = require("../models/chatMessage");
// Send a message
const sendMessage = async (req, res) => {
    try {
        const { booking, sender, message } = req.body;
        const chatMessage = new chatMessage_1.ChatMessage({ booking, sender, message });
        await chatMessage.save();
        res.status(201).json(chatMessage);
    }
    catch (err) {
        res.status(500).json({ message: 'Error sending message.' });
    }
};
exports.sendMessage = sendMessage;
// Get chat history for a booking
const getChatForBooking = async (req, res) => {
    try {
        const messages = await chatMessage_1.ChatMessage.find({ booking: req.params.bookingId })
            .populate('sender', 'firstName lastName email')
            .sort({ createdAt: 1 });
        res.json(messages);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching chat history.' });
    }
};
exports.getChatForBooking = getChatForBooking;
