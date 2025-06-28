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
      let conversationKey = '';
      let otherParticipant = null;
      
      if (message.property) {
        // For property conversations, create a consistent key regardless of sender/receiver order
        const participants = [message.sender._id.toString(), message.receiver._id.toString()].sort();
        conversationKey = `property_${message.property._id}_${participants[0]}_${participants[1]}`;
        otherParticipant = message.sender._id.toString() === userId ? message.receiver : message.sender;
      } else if (message.booking) {
        conversationKey = `booking_${message.booking._id}`;
        otherParticipant = message.sender._id.toString() === userId ? message.receiver : message.sender;
      }
      
      if (conversationKey && !conversations.has(conversationKey)) {
        conversations.set(conversationKey, {
          id: conversationKey,
          type: message.property ? 'property' : 'booking',
          property: message.property,
          booking: message.booking,
          lastMessage: message,
          participants: [otherParticipant],
          unreadCount: 0
        });
      }
    });

    // Count unread messages for each conversation
    conversations.forEach((conv, key) => {
      let unreadCount = 0;
      
      if (conv.type === 'property') {
        // For property conversations, count unread messages between the two participants
        const participants = key.split('_').slice(2); // Get the two user IDs
        messages.forEach(msg => {
          if (
            msg.property && 
            msg.property._id.toString() === conv.property._id.toString() &&
            msg.receiver._id.toString() === userId &&
            msg.isRead === false &&
            (msg.sender._id.toString() === participants[0] || msg.sender._id.toString() === participants[1])
          ) {
            unreadCount++;
          }
        });
      } else if (conv.type === 'booking') {
        // For booking conversations, count unread messages in the booking
        messages.forEach(msg => {
          if (
            msg.booking && 
            msg.booking._id.toString() === conv.booking._id.toString() &&
            msg.receiver._id.toString() === userId &&
            msg.isRead === false
          ) {
            unreadCount++;
          }
        });
      }
      
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