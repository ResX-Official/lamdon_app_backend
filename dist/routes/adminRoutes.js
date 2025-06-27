"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../middleware/adminAuth");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
// Apply admin authentication to all routes
router.use(adminAuth_1.adminAuth);
// ==================== DASHBOARD ====================
router.get('/dashboard', adminController_1.getDashboardStats);
// ==================== PROPERTY APPROVAL ====================
router.get('/properties/pending', adminController_1.getPendingProperties);
router.get('/properties', adminController_1.getAllProperties);
router.post('/properties/:id/approve', adminController_1.approveProperty);
router.post('/properties/:id/reject', adminController_1.rejectProperty);
// ==================== USER MANAGEMENT ====================
router.get('/users', adminController_1.getAllUsers);
router.get('/users/:id', adminController_1.getUserDetails);
router.post('/users/:id/block', adminController_1.blockUser);
router.post('/users/:id/unblock', adminController_1.unblockUser);
// ==================== CHAT MANAGEMENT ====================
router.get('/chats', adminController_1.getAllChats);
router.get('/chats/conversation/:user1Id/:user2Id', adminController_1.getChatConversation);
router.get('/chats/conversation/:user1Id/:user2Id/:propertyId', adminController_1.getChatConversation);
// ==================== WITHDRAWAL APPROVAL ====================
router.get('/withdrawals/pending', adminController_1.getPendingWithdrawals);
router.post('/withdrawals/:id/approve', adminController_1.approveWithdrawal);
router.post('/withdrawals/:id/reject', adminController_1.rejectWithdrawal);
// ==================== BOOKING MANAGEMENT ====================
router.get('/bookings', adminController_1.getAllBookings);
router.put('/bookings/:id/status', adminController_1.updateBookingStatus);
exports.default = router;
