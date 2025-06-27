"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationMessages = exports.getUserConversations = exports.getChatForProperty = exports.getChatForBooking = exports.sendMessage = void 0;
const chatMessage_1 = require("../models/chatMessage");
// Send a message
const sendMessage = async (req, res) => {
    try {
        const { booking, property, sender, receiver, message } = req.body;
        // Validate that either booking or property is provided
        if (!booking && !property) {
            return res.status(400).json({ message: 'Either booking or property is required.' });
        }
        const chatMessage = new chatMessage_1.ChatMessage({
            booking,
            property,
            sender,
            receiver,
            message
        });
        await chatMessage.save();
        // Populate sender and receiver details
        await chatMessage.populate('sender', 'firstName lastName email');
        await chatMessage.populate('receiver', 'firstName lastName email');
        res.status(201).json(chatMessage);
    }
    catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ message: 'Error sending message.' });
    }
};
exports.sendMessage = sendMessage;
// Get chat history for a booking
const getChatForBooking = async (req, res) => {
    try {
        const messages = await chatMessage_1.ChatMessage.find({ booking: req.params.bookingId })
            .populate('sender', 'firstName lastName email')
            .populate('receiver', 'firstName lastName email')
            .sort({ createdAt: 1 });
        res.json(messages);
    }
    catch (err) {
        console.error('Error fetching chat history:', err);
        res.status(500).json({ message: 'Error fetching chat history.' });
    }
};
exports.getChatForBooking = getChatForBooking;
// Get chat history for a property
const getChatForProperty = async (req, res) => {
    try {
        const { propertyId, userId1, userId2 } = req.params;
        const messages = await chatMessage_1.ChatMessage.find({
            property: propertyId,
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 }
            ]
        })
            .populate('sender', 'firstName lastName email')
            .populate('receiver', 'firstName lastName email')
            .sort({ createdAt: 1 });
        res.json(messages);
    }
    catch (err) {
        console.error('Error fetching property chat history:', err);
        res.status(500).json({ message: 'Error fetching property chat history.' });
    }
};
exports.getChatForProperty = getChatForProperty;
// Get all conversations for a user
const getUserConversations = async (req, res) => {
    try {
        const userId = req.params.userId;
        // Get all messages where user is sender or receiver
        const messages = await chatMessage_1.ChatMessage.find({
            $or: [{ sender: userId }, { receiver: userId }]
        })
            .populate('sender', 'firstName lastName email')
            .populate('receiver', 'firstName lastName email')
            .populate('property', 'title address images')
            .populate('booking', 'checkIn checkOut')
            .sort({ createdAt: -1 });
        // Group messages by conversation (property or booking)
        const conversations = new Map();
        messages.forEach(message => {
            const conversationKey = message.property
                ? `property_${message.property._id}_${message.sender._id}_${message.receiver._id}`
                : message.booking?._id
                    ? `booking_${message.booking._id}`
                    : '';
            if (!conversations.has(conversationKey)) {
                conversations.set(conversationKey, {
                    id: conversationKey,
                    type: message.property ? 'property' : 'booking',
                    property: message.property,
                    booking: message.booking,
                    lastMessage: message,
                    participants: [
                        message.sender._id.toString() === userId ? message.receiver : message.sender
                    ]
                });
            }
        });
        const conversationList = Array.from(conversations.values());
        res.json(conversationList);
    }
    catch (err) {
        console.error('Error fetching user conversations:', err);
        res.status(500).json({ message: 'Error fetching user conversations.' });
    }
};
exports.getUserConversations = getUserConversations;
// Get conversation messages
const getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        // Parse conversation ID to determine type and participants
        const parts = conversationId.split('_');
        let query = {};
        if (parts[0] === 'property') {
            const propertyId = parts[1];
            const userId1 = parts[2];
            const userId2 = parts[3];
            query = {
                property: propertyId,
                $or: [
                    { sender: userId1, receiver: userId2 },
                    { sender: userId2, receiver: userId1 }
                ]
            };
        }
        else if (parts[0] === 'booking') {
            const bookingId = parts[1];
            query = { booking: bookingId };
        }
        const messages = await chatMessage_1.ChatMessage.find(query)
            .populate('sender', 'firstName lastName email')
            .populate('receiver', 'firstName lastName email')
            .sort({ createdAt: 1 });
        res.json(messages);
    }
    catch (err) {
        console.error('Error fetching conversation messages:', err);
        res.status(500).json({ message: 'Error fetching conversation messages.' });
    }
};
exports.getConversationMessages = getConversationMessages;
