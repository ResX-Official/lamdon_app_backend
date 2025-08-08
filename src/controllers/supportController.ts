import { Request, Response } from 'express';
import { SupportTicket } from '../models/supportTicket';
import { Notification } from '../models/notification';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

// Create a new support ticket
export const createSupportTicket = async (req: Request, res: Response) => {
  try {
    const { title, description, category, priority } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required'
      });
    }

    const ticket = new SupportTicket({
      user: new mongoose.Types.ObjectId(userId),
      title,
      description,
      category,
      priority: priority || 'medium',
      messages: [{
        sender: new mongoose.Types.ObjectId(userId),
        senderType: 'user',
        message: description,
        timestamp: new Date()
      }]
    });

    await ticket.save();
    await ticket.populate('user', 'firstName lastName email');

    // Notify admins about new ticket
    await new Notification({
      recipient: null, // For all admins
      title: 'New Support Ticket',
      message: `New ${category} support ticket: ${title}`,
      type: 'support',
      relatedTicket: ticket._id
    }).save();

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Support ticket created successfully'
    });

  } catch (err) {
    console.error('Error creating support ticket:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating support ticket'
    });
  }
};

// Get user's support tickets
export const getUserSupportTickets = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, category, page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const filter: any = { user: new mongoose.Types.ObjectId(userId) };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await SupportTicket.countDocuments(filter);

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (err) {
    console.error('Error fetching support tickets:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching support tickets'
    });
  }
};

// Get single support ticket
export const getSupportTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.isAdmin;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const filter: any = { _id: new mongoose.Types.ObjectId(id) };
    if (!isAdmin) {
      filter.user = new mongoose.Types.ObjectId(userId); // Users can only see their own tickets
    }

    const ticket = await SupportTicket.findOne(filter)
      .populate('user', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('messages.sender', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (err) {
    console.error('Error fetching support ticket:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching support ticket'
    });
  }
};

// Add message to support ticket
export const addMessageToTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;
    const isAdmin = req.user?.isAdmin;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const filter: any = { _id: new mongoose.Types.ObjectId(id) };
    if (!isAdmin) {
      filter.user = new mongoose.Types.ObjectId(userId); // Users can only reply to their own tickets
    }

    const ticket = await SupportTicket.findOne(filter);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Add message
    ticket.messages.push({
      sender: new mongoose.Types.ObjectId(userId),
      senderType: isAdmin ? 'admin' : 'user',
      message,
      timestamp: new Date()
    });

    // Update ticket status if it was resolved/closed and user is replying
    if (!isAdmin && ['resolved', 'closed'].includes(ticket.status)) {
      ticket.status = 'open';
    } else if (isAdmin && ticket.status === 'open') {
      ticket.status = 'in-progress';
    }

    await ticket.save();

    // Populate the ticket after saving
    await ticket.populate('user', 'firstName lastName email');
    await ticket.populate('assignedTo', 'firstName lastName email');
    await ticket.populate('messages.sender', 'firstName lastName email');

    // Create notification
    if (isAdmin) {
      // Admin replied, notify user
      await new Notification({
        recipient: ticket.user._id,
        title: 'Support Reply',
        message: `Admin replied to your support ticket: ${ticket.title}`,
        type: 'support',
        relatedTicket: ticket._id
      }).save();
    } else {
      // User replied, notify admin (use user ID as string for now)
      await new Notification({
        recipient: new mongoose.Types.ObjectId(userId),
        title: 'Support Ticket Reply',
        message: `User replied to support ticket: ${ticket.title}`,
        type: 'support',
        relatedTicket: ticket._id
      }).save();
    }

    res.json({
      success: true,
      data: ticket,
      message: 'Message added successfully'
    });

  } catch (err) {
    console.error('Error adding message to ticket:', err);
    res.status(500).json({
      success: false,
      message: 'Error adding message to ticket'
    });
  }
};

// Close support ticket (user only)
export const closeSupportTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const ticket = await SupportTicket.findOne({ _id: new mongoose.Types.ObjectId(id), user: new mongoose.Types.ObjectId(userId) });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    ticket.status = 'closed';
    await ticket.save();

    res.json({
      success: true,
      message: 'Support ticket closed successfully'
    });

  } catch (err) {
    console.error('Error closing support ticket:', err);
    res.status(500).json({
      success: false,
      message: 'Error closing support ticket'
    });
  }
};

// Admin functions
export const getAllSupportTickets = async (req: Request, res: Response) => {
  try {
    const { status, category, priority, assignedTo, page = 1, limit = 10, search } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = new mongoose.Types.ObjectId(assignedTo as string);
    
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await SupportTicket.countDocuments(filter);

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (err) {
    console.error('Error fetching all support tickets:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching support tickets'
    });
  }
};

export const updateSupportTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, resolutionNotes } = req.body;
    const adminId = req.user?.id;

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date();
        if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
      }
    }
    if (priority) updateData.priority = priority;
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null;
    }

    const ticket = await SupportTicket.findByIdAndUpdate(new mongoose.Types.ObjectId(id), updateData, { new: true })
      .populate('user', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Notify user of status change
    if (status && status !== ticket.status) {
      await new Notification({
        recipient: ticket.user._id,
        title: 'Support Ticket Update',
        message: `Your support ticket status has been updated to: ${status}`,
        type: 'support',
        relatedTicket: ticket._id
      }).save();
    }

    res.json({
      success: true,
      data: ticket,
      message: 'Support ticket updated successfully'
    });

  } catch (err) {
    console.error('Error updating support ticket:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating support ticket'
    });
  }
};
