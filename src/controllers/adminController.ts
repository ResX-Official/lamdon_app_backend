import { Request, Response } from 'express';
import { Property } from '../models/property';
import { User } from '../models/user';
import { ChatMessage } from '../models/chatMessage';
import { Transaction } from '../models/transaction';
import { Booking } from '../models/booking';
import { AuthRequest } from '../middleware/adminAuth';

// ==================== PROPERTY APPROVAL FEATURES ====================

// 1. Get all pending properties for approval
export const getPendingProperties = async (req: Request, res: Response) => {
  try {
    const properties = await Property.find({ status: 'pending' })
      .populate('host', 'firstName lastName email phone profileImage')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: properties,
      count: properties.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching pending properties', error });
  }
};

// 2. Approve a property listing
export const approveProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const property = await Property.findByIdAndUpdate(
      id, 
      { 
        status: 'approved',
        adminNotes: adminNotes || `Approved by admin ${req.user?.firstName} ${req.user?.lastName}`
      }, 
      { new: true }
    ).populate('host', 'firstName lastName email phone');

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({
      success: true,
      message: 'Property approved successfully',
      data: property
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error approving property', error });
  }
};

// 3. Reject a property listing
export const rejectProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const property = await Property.findByIdAndUpdate(
      id, 
      { 
        status: 'rejected',
        rejectionReason,
        adminNotes: `Rejected by admin ${req.user?.firstName} ${req.user?.lastName}`
      }, 
      { new: true }
    ).populate('host', 'firstName lastName email phone');

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({
      success: true,
      message: 'Property rejected successfully',
      data: property
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error rejecting property', error });
  }
};

// 4. Get all properties with filters
export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const { status, hostId, city, page = 1, limit = 10 } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (hostId) filter.host = hostId;
    if (city) filter['location.city'] = { $regex: new RegExp(city as string, 'i') };

    const properties = await Property.find(filter)
      .populate('host', 'firstName lastName email phone profileImage userType')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Property.countDocuments(filter);

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching properties', error });
  }
};

// ==================== USER MANAGEMENT FEATURES ====================

// 5. Get all users with filters
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { userType, blocked, verificationStatus, page = 1, limit = 10, search } = req.query;
    
    const filter: any = {};
    if (userType) filter.userType = userType;
    if (blocked !== undefined) filter.blocked = blocked === 'true';
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
      // Try to match ObjectId if search looks like one
      if (/^[0-9a-fA-F]{24}$/.test(search as string)) {
        filter.$or.push({ _id: search });
      }
    }

    const users = await User.find(filter)
      .select('-password -confirmationCode')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error });
  }
};

// 6. Block a user
export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      id, 
      { 
        blocked: true,
        adminNotes: `Blocked by admin ${req.user?.firstName} ${req.user?.lastName}. Reason: ${reason || 'Terms violation'}`
      }, 
      { new: true }
    ).select('-password -confirmationCode');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User blocked successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error blocking user', error });
  }
};

// 7. Unblock a user
export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id, 
      { 
        blocked: false,
        adminNotes: `Unblocked by admin ${req.user?.firstName} ${req.user?.lastName}`
      }, 
      { new: true }
    ).select('-password -confirmationCode');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User unblocked successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error unblocking user', error });
  }
};

// 8. Get detailed user information
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -confirmationCode');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's properties
    const properties = await Property.find({ host: id });
    
    // Get user's bookings as guest
    const guestBookings = await Booking.find({ guest: id })
      .populate('property', 'title address images')
      .populate('host', 'firstName lastName email');
    
    // Get user's bookings as host (from their properties)
    const userProperties = await Property.find({ host: id }).select('_id');
    const propertyIds = userProperties.map(p => p._id);
    
    const hostBookings = await Booking.find({ property: { $in: propertyIds } })
      .populate('property', 'title address images')
      .populate('guest', 'firstName lastName email');

    // Get user's transactions
    const transactions = await Transaction.find({ user: id });

    res.json({
      success: true,
      data: {
        user,
        properties,
        bookings: {
          asGuest: guestBookings,
          asHost: hostBookings
        },
        transactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user details', error });
  }
};

// ==================== CHAT MANAGEMENT FEATURES ====================

// 9. Get all chats with filters
export const getAllChats = async (req: Request, res: Response) => {
  try {
    const { userId, propertyId, bookingId, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (userId) {
      filter.$or = [
        { sender: userId },
        { receiver: userId }
      ];
    }
    if (propertyId) filter.property = propertyId;
    if (bookingId) filter.booking = bookingId;

    const chats = await ChatMessage.find(filter)
      .populate('sender', 'firstName lastName email phone')
      .populate('receiver', 'firstName lastName email phone')
      .populate('property', 'title address')
      .populate('booking', 'startDate endDate totalAmount')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await ChatMessage.countDocuments(filter);

    res.json({
      success: true,
      data: chats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching chats', error });
  }
};

// 10. Get chat conversation between two users
export const getChatConversation = async (req: Request, res: Response) => {
  try {
    const { user1Id, user2Id, propertyId } = req.params;

    const filter: any = {
      $or: [
        { sender: user1Id, receiver: user2Id },
        { sender: user2Id, receiver: user1Id }
      ]
    };

    if (propertyId) filter.property = propertyId;

    const messages = await ChatMessage.find(filter)
      .populate('sender', 'firstName lastName email phone')
      .populate('receiver', 'firstName lastName email phone')
      .populate('property', 'title address')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching chat conversation', error });
  }
};

// 9b. Get all unique chat threads (for admin dashboard)
export const getChatThreads = async (req: Request, res: Response) => {
  try {
    // Aggregate unique pairs of sender/receiver
    const threads = await ChatMessage.aggregate([
      {
        $project: {
          participants: ["$sender", "$receiver"],
          lastMessage: "$text",
          createdAt: 1,
        }
      },
      {
        $addFields: {
          threadId: {
            $cond: [
              { $lt: ["$participants.0", "$participants.1"] },
              { $concat: [{$toString: "$participants.0"}, "_", {$toString: "$participants.1"}] },
              { $concat: [{$toString: "$participants.1"}, "_", {$toString: "$participants.0"}] }
            ]
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$threadId",
          participants: { $first: "$participants" },
          lastMessage: { $first: "$lastMessage" },
          lastCreatedAt: { $first: "$createdAt" },
        }
      },
      { $sort: { lastCreatedAt: -1 } }
    ]);

    // Defensive: filter out threads with missing participants
    const populatedThreads = await Promise.all(threads.map(async (thread: any) => {
      try {
        const users = await User.find({ _id: { $in: thread.participants } }).select('firstName lastName email profileImage');
        if (!users || users.length < 2) {
          console.warn('Insufficient users found for thread', thread._id);
          return null;
        }
        return {
          threadId: thread._id,
          participants: users,
          lastMessage: thread.lastMessage,
          lastCreatedAt: thread.lastCreatedAt,
        };
      } catch (err) {
        console.error('Error populating users for thread', thread._id, err);
        return null;
      }
    }));

    res.json({
      success: true,
      data: populatedThreads.filter(Boolean)
    });
  } catch (error: any) {
    console.error('Error in getChatThreads:', error);
    res.status(500).json({ success: false, message: 'Error fetching chat threads', error: error.message });
  }
};

// ==================== WITHDRAWAL APPROVAL FEATURES ====================

// 11. Get pending withdrawals
export const getPendingWithdrawals = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const withdrawals = await Transaction.find({ 
      type: 'withdraw', 
      status: 'pending' 
    })
      .populate('user', 'firstName lastName email phone balance')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Transaction.countDocuments({ type: 'withdraw', status: 'pending' });

    res.json({
      success: true,
      data: withdrawals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching pending withdrawals', error });
  }
};

// 12. Approve withdrawal
export const approveWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes, reference } = req.body;

    const withdrawal = await Transaction.findById(id);
    
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Withdrawal is not pending' });
    }

    // Update withdrawal status
    withdrawal.status = 'success';
    withdrawal.adminNotes = adminNotes || `Approved by admin ${req.user?.firstName} ${req.user?.lastName}`;
    withdrawal.reference = reference;
    await withdrawal.save();

    // Update user balance
    const user = await User.findById(withdrawal.user);
    if (user) {
      user.balance -= withdrawal.amount;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      data: withdrawal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error approving withdrawal', error });
  }
};

// 13. Reject withdrawal
export const rejectWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const withdrawal = await Transaction.findByIdAndUpdate(
      id, 
      { 
        status: 'failed',
        rejectionReason,
        adminNotes: `Rejected by admin ${req.user?.firstName} ${req.user?.lastName}`
      }, 
      { new: true }
    ).populate('user', 'firstName lastName email phone');

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    res.json({
      success: true,
      message: 'Withdrawal rejected successfully',
      data: withdrawal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error rejecting withdrawal', error });
  }
};

// ==================== BOOKING MANAGEMENT FEATURES ====================

// 14. Get all bookings with filters
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { status, guestId, hostId, propertyId, page = 1, limit = 10 } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (guestId) filter.guest = guestId;
    if (hostId) filter.host = hostId;
    if (propertyId) filter.property = propertyId;

    const bookings = await Booking.find(filter)
      .populate('property', 'title address images')
      .populate('guest', 'firstName lastName email phone')
      .populate('host', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bookings', error });
  }
};

// 15. Update booking status
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id, 
      { 
        status,
        adminNotes: adminNotes || `Status updated by admin ${req.user?.firstName} ${req.user?.lastName}`
      }, 
      { new: true }
    )
      .populate('property', 'title address')
      .populate('guest', 'firstName lastName email phone')
      .populate('host', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating booking status', error });
  }
};

// ==================== DASHBOARD STATISTICS ====================

// 16. Get admin dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalProperties,
      totalBookings,
      totalTransactions,
      pendingProperties,
      pendingWithdrawals,
      blockedUsers,
      recentBookings
    ] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Booking.countDocuments(),
      Transaction.countDocuments(),
      Property.countDocuments({ status: 'pending' }),
      Transaction.countDocuments({ type: 'withdraw', status: 'pending' }),
      User.countDocuments({ blocked: true }),
      Booking.find().populate('property guest host').sort({ createdAt: -1 }).limit(5)
    ]);

    // Get revenue statistics
    const successfulTransactions = await Transaction.find({ 
      type: 'add', 
      status: 'success' 
    });
    
    const totalRevenue = successfulTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProperties,
        totalBookings,
        totalTransactions,
        pendingProperties,
        pendingWithdrawals,
        blockedUsers,
        totalRevenue,
        recentBookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats', error });
  }
}; 