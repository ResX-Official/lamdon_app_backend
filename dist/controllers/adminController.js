"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.updateBookingStatus = exports.getAllBookings = exports.rejectWithdrawal = exports.approveWithdrawal = exports.getPendingWithdrawals = exports.getChatConversation = exports.getAllChats = exports.getUserDetails = exports.unblockUser = exports.blockUser = exports.getAllUsers = exports.getAllProperties = exports.rejectProperty = exports.approveProperty = exports.getPendingProperties = void 0;
const property_1 = require("../models/property");
const user_1 = require("../models/user");
const chatMessage_1 = require("../models/chatMessage");
const transaction_1 = require("../models/transaction");
const booking_1 = require("../models/booking");
// ==================== PROPERTY APPROVAL FEATURES ====================
// 1. Get all pending properties for approval
const getPendingProperties = async (req, res) => {
    try {
        const properties = await property_1.Property.find({ status: 'pending' })
            .populate('host', 'firstName lastName email phone')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: properties,
            count: properties.length
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching pending properties', error });
    }
};
exports.getPendingProperties = getPendingProperties;
// 2. Approve a property listing
const approveProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        const property = await property_1.Property.findByIdAndUpdate(id, {
            status: 'approved',
            adminNotes: adminNotes || `Approved by admin ${req.user?.firstName} ${req.user?.lastName}`
        }, { new: true }).populate('host', 'firstName lastName email phone');
        if (!property) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }
        res.json({
            success: true,
            message: 'Property approved successfully',
            data: property
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error approving property', error });
    }
};
exports.approveProperty = approveProperty;
// 3. Reject a property listing
const rejectProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        if (!rejectionReason) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }
        const property = await property_1.Property.findByIdAndUpdate(id, {
            status: 'rejected',
            rejectionReason,
            adminNotes: `Rejected by admin ${req.user?.firstName} ${req.user?.lastName}`
        }, { new: true }).populate('host', 'firstName lastName email phone');
        if (!property) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }
        res.json({
            success: true,
            message: 'Property rejected successfully',
            data: property
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error rejecting property', error });
    }
};
exports.rejectProperty = rejectProperty;
// 4. Get all properties with filters
const getAllProperties = async (req, res) => {
    try {
        const { status, hostId, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (hostId)
            filter.host = hostId;
        const properties = await property_1.Property.find(filter)
            .populate('host', 'firstName lastName email phone')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await property_1.Property.countDocuments(filter);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching properties', error });
    }
};
exports.getAllProperties = getAllProperties;
// ==================== USER MANAGEMENT FEATURES ====================
// 5. Get all users with filters
const getAllUsers = async (req, res) => {
    try {
        const { userType, blocked, verificationStatus, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (userType)
            filter.userType = userType;
        if (blocked !== undefined)
            filter.blocked = blocked === 'true';
        if (verificationStatus)
            filter.verificationStatus = verificationStatus;
        const users = await user_1.User.find(filter)
            .select('-password -confirmationCode')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await user_1.User.countDocuments(filter);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching users', error });
    }
};
exports.getAllUsers = getAllUsers;
// 6. Block a user
const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const user = await user_1.User.findByIdAndUpdate(id, {
            blocked: true,
            adminNotes: `Blocked by admin ${req.user?.firstName} ${req.user?.lastName}. Reason: ${reason || 'Terms violation'}`
        }, { new: true }).select('-password -confirmationCode');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({
            success: true,
            message: 'User blocked successfully',
            data: user
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error blocking user', error });
    }
};
exports.blockUser = blockUser;
// 7. Unblock a user
const unblockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await user_1.User.findByIdAndUpdate(id, {
            blocked: false,
            adminNotes: `Unblocked by admin ${req.user?.firstName} ${req.user?.lastName}`
        }, { new: true }).select('-password -confirmationCode');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({
            success: true,
            message: 'User unblocked successfully',
            data: user
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error unblocking user', error });
    }
};
exports.unblockUser = unblockUser;
// 8. Get detailed user information
const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await user_1.User.findById(id).select('-password -confirmationCode');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Get user's properties
        const properties = await property_1.Property.find({ host: id });
        // Get user's bookings
        const bookings = await booking_1.Booking.find({
            $or: [{ guest: id }, { host: id }]
        }).populate('property guest host');
        // Get user's transactions
        const transactions = await transaction_1.Transaction.find({ user: id });
        res.json({
            success: true,
            data: {
                user,
                properties,
                bookings,
                transactions
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching user details', error });
    }
};
exports.getUserDetails = getUserDetails;
// ==================== CHAT MANAGEMENT FEATURES ====================
// 9. Get all chats with filters
const getAllChats = async (req, res) => {
    try {
        const { userId, propertyId, bookingId, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (userId) {
            filter.$or = [
                { sender: userId },
                { receiver: userId }
            ];
        }
        if (propertyId)
            filter.property = propertyId;
        if (bookingId)
            filter.booking = bookingId;
        const chats = await chatMessage_1.ChatMessage.find(filter)
            .populate('sender', 'firstName lastName email phone')
            .populate('receiver', 'firstName lastName email phone')
            .populate('property', 'title address')
            .populate('booking', 'startDate endDate totalAmount')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await chatMessage_1.ChatMessage.countDocuments(filter);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching chats', error });
    }
};
exports.getAllChats = getAllChats;
// 10. Get chat conversation between two users
const getChatConversation = async (req, res) => {
    try {
        const { user1Id, user2Id, propertyId } = req.params;
        const filter = {
            $or: [
                { sender: user1Id, receiver: user2Id },
                { sender: user2Id, receiver: user1Id }
            ]
        };
        if (propertyId)
            filter.property = propertyId;
        const messages = await chatMessage_1.ChatMessage.find(filter)
            .populate('sender', 'firstName lastName email phone')
            .populate('receiver', 'firstName lastName email phone')
            .populate('property', 'title address')
            .sort({ createdAt: 1 });
        res.json({
            success: true,
            data: messages
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching chat conversation', error });
    }
};
exports.getChatConversation = getChatConversation;
// ==================== WITHDRAWAL APPROVAL FEATURES ====================
// 11. Get pending withdrawals
const getPendingWithdrawals = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const withdrawals = await transaction_1.Transaction.find({
            type: 'withdraw',
            status: 'pending'
        })
            .populate('user', 'firstName lastName email phone balance')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await transaction_1.Transaction.countDocuments({ type: 'withdraw', status: 'pending' });
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching pending withdrawals', error });
    }
};
exports.getPendingWithdrawals = getPendingWithdrawals;
// 12. Approve withdrawal
const approveWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes, reference } = req.body;
        const withdrawal = await transaction_1.Transaction.findById(id);
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
        const user = await user_1.User.findById(withdrawal.user);
        if (user) {
            user.balance -= withdrawal.amount;
            await user.save();
        }
        res.json({
            success: true,
            message: 'Withdrawal approved successfully',
            data: withdrawal
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error approving withdrawal', error });
    }
};
exports.approveWithdrawal = approveWithdrawal;
// 13. Reject withdrawal
const rejectWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        if (!rejectionReason) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }
        const withdrawal = await transaction_1.Transaction.findByIdAndUpdate(id, {
            status: 'failed',
            rejectionReason,
            adminNotes: `Rejected by admin ${req.user?.firstName} ${req.user?.lastName}`
        }, { new: true }).populate('user', 'firstName lastName email phone');
        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        }
        res.json({
            success: true,
            message: 'Withdrawal rejected successfully',
            data: withdrawal
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error rejecting withdrawal', error });
    }
};
exports.rejectWithdrawal = rejectWithdrawal;
// ==================== BOOKING MANAGEMENT FEATURES ====================
// 14. Get all bookings with filters
const getAllBookings = async (req, res) => {
    try {
        const { status, guestId, hostId, propertyId, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (guestId)
            filter.guest = guestId;
        if (hostId)
            filter.host = hostId;
        if (propertyId)
            filter.property = propertyId;
        const bookings = await booking_1.Booking.find(filter)
            .populate('property', 'title address images')
            .populate('guest', 'firstName lastName email phone')
            .populate('host', 'firstName lastName email phone')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await booking_1.Booking.countDocuments(filter);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching bookings', error });
    }
};
exports.getAllBookings = getAllBookings;
// 15. Update booking status
const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const booking = await booking_1.Booking.findByIdAndUpdate(id, {
            status,
            adminNotes: adminNotes || `Status updated by admin ${req.user?.firstName} ${req.user?.lastName}`
        }, { new: true })
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error updating booking status', error });
    }
};
exports.updateBookingStatus = updateBookingStatus;
// ==================== DASHBOARD STATISTICS ====================
// 16. Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalProperties, totalBookings, totalTransactions, pendingProperties, pendingWithdrawals, blockedUsers, recentBookings] = await Promise.all([
            user_1.User.countDocuments(),
            property_1.Property.countDocuments(),
            booking_1.Booking.countDocuments(),
            transaction_1.Transaction.countDocuments(),
            property_1.Property.countDocuments({ status: 'pending' }),
            transaction_1.Transaction.countDocuments({ type: 'withdraw', status: 'pending' }),
            user_1.User.countDocuments({ blocked: true }),
            booking_1.Booking.find().populate('property guest host').sort({ createdAt: -1 }).limit(5)
        ]);
        // Get revenue statistics
        const successfulTransactions = await transaction_1.Transaction.find({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching dashboard stats', error });
    }
};
exports.getDashboardStats = getDashboardStats;
