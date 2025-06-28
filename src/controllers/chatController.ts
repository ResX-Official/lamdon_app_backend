import { Request, Response } from 'express';
import { ChatMessage } from '../models/chatMessage';

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { booking, property, sender, receiver, message } = req.body;
    
    // Validate that either booking or property is provided
    if (!booking && !property) {
      return res.status(400).json({ message: 'Either booking or property is required.' });
    }
    
    const chatMessage = new ChatMessage({ 
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
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Error sending message.' });
  }
};

// Get chat history for a booking
export const getChatForBooking = async (req: Request, res: Response) => {
  try {
    const messages = await ChatMessage.find({ booking: req.params.bookingId })
      .populate('sender', 'firstName lastName email')
      .populate('receiver', 'firstName lastName email')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ message: 'Error fetching chat history.' });
  }
};

// Get chat history for a property
export const getChatForProperty = async (req: Request, res: Response) => {
  try {
    const { propertyId, userId1, userId2 } = req.params;
    // Mark all messages as read where receiver is the current user (userId1) and isRead is false
    await ChatMessage.updateMany(
      {
        property: propertyId,
        receiver: userId1,
        isRead: false,
        $or: [
          { sender: userId2, receiver: userId1 },
          { sender: userId1, receiver: userId2 }
        ]
      },
      { $set: { isRead: true } }
    );
    const messages = await ChatMessage.find({ 
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
  } catch (err) {
    console.error('Error fetching property chat history:', err);
    res.status(500).json({ message: 'Error fetching property chat history.' });
  }
};

// Get all conversations for a user
export const getUserConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    // Get all messages where user is sender or receiver
    const messages = await ChatMessage.find({
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
          ],
          unreadCount: 0 // Will be updated below
        });
      }
    });

    // Count unread messages for each conversation
    conversations.forEach((conv, key) => {
      let unreadCount = 0;
      messages.forEach(msg => {
        const isSameConversation = msg.property && conv.property && msg.property._id.toString() === conv.property._id.toString()
          ? ((msg.sender._id.toString() === userId || msg.receiver._id.toString() === userId) &&
            ((msg.sender._id.toString() === conv.lastMessage.sender._id.toString() && msg.receiver._id.toString() === conv.lastMessage.receiver._id.toString()) ||
             (msg.sender._id.toString() === conv.lastMessage.receiver._id.toString() && msg.receiver._id.toString() === conv.lastMessage.sender._id.toString())))
          : msg.booking && conv.booking && msg.booking._id.toString() === conv.booking._id.toString();
        if (
          isSameConversation &&
          msg.receiver._id.toString() === userId &&
          msg.isRead === false
        ) {
          unreadCount++;
        }
      });
      conv.unreadCount = unreadCount;
    });

    const conversationList = Array.from(conversations.values());
    res.json(conversationList);
  } catch (err) {
    console.error('Error fetching user conversations:', err);
    res.status(500).json({ message: 'Error fetching user conversations.' });
  }
};

// Get conversation messages
export const getConversationMessages = async (req: Request, res: Response) => {
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
    } else if (parts[0] === 'booking') {
      const bookingId = parts[1];
      query = { booking: bookingId };
    }
    
    const messages = await ChatMessage.find(query)
      .populate('sender', 'firstName lastName email')
      .populate('receiver', 'firstName lastName email')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    console.error('Error fetching conversation messages:', err);
    res.status(500).json({ message: 'Error fetching conversation messages.' });
  }
};