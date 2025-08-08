import { Router } from 'express';
import {
  createSupportTicket,
  getUserSupportTickets,
  getSupportTicket,
  addMessageToTicket,
  closeSupportTicket,
  getAllSupportTickets,
  updateSupportTicket
} from '../controllers/supportController';
import { authenticateToken } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// User routes (require authentication)
router.post('/', authenticateToken, createSupportTicket);
router.get('/my-tickets', authenticateToken, getUserSupportTickets);
router.get('/:id', authenticateToken, getSupportTicket);
router.post('/:id/messages', authenticateToken, addMessageToTicket);
router.patch('/:id/close', authenticateToken, closeSupportTicket);

// Admin routes (require admin authentication)
router.get('/', adminAuth, getAllSupportTickets);
router.patch('/:id', adminAuth, updateSupportTicket);

export default router;
