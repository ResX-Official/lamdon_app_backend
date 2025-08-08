import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth';
import {
  getPendingProperties,
  approveProperty,
  rejectProperty,
  getAllProperties,
  getAllUsers,
  blockUser,
  unblockUser,
  getUserDetails,
  getAllChats,
  getChatConversation,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getAllBookings,
  updateBookingStatus,
  getDashboardStats,
  getChatThreads
} from '../controllers/adminController';
import {
  getAllSupportTickets,
  updateSupportTicket,
  addMessageToTicket
} from '../controllers/supportController';

const router = Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// ==================== DASHBOARD ====================
router.get('/dashboard', getDashboardStats);

// ==================== PROPERTY APPROVAL ====================
router.get('/properties/pending', getPendingProperties);
router.get('/properties', getAllProperties);
router.post('/properties/:id/approve', approveProperty);
router.post('/properties/:id/reject', rejectProperty);

// ==================== USER MANAGEMENT ====================
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.post('/users/:id/block', blockUser);
router.post('/users/:id/unblock', unblockUser);

// ==================== CHAT MANAGEMENT ====================
router.get('/chats', getAllChats);
router.get('/chats/conversation/:user1Id/:user2Id', getChatConversation);
router.get('/chats/conversation/:user1Id/:user2Id/:propertyId', getChatConversation);

// ==================== WITHDRAWAL APPROVAL ====================
router.get('/withdrawals/pending', getPendingWithdrawals);
router.post('/withdrawals/:id/approve', approveWithdrawal);
router.post('/withdrawals/:id/reject', rejectWithdrawal);

// ==================== BOOKING MANAGEMENT ====================
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/status', updateBookingStatus);

// ==================== CHAT THREADS ====================
router.get('/chat-threads', getChatThreads);

// ==================== SUPPORT MANAGEMENT ====================
router.get('/support-tickets', getAllSupportTickets);
router.patch('/support-tickets/:id', updateSupportTicket);
router.post('/support-tickets/:id/messages', addMessageToTicket);

export default router;
